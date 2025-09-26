import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, PanResponder, RefreshControl, Modal, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
// Lightweight in-file slider to avoid native deps
// (removed unused imports)
import resolveMediaUri from '../utils/resolveMediaUri';
import { MediaCache } from '../utils/mediaCache';
// (removed persistence imports)
// Defer jpeg-js import to runtime to avoid module init issues on screen mount
import { Buffer } from 'buffer';

interface AssetWithScore extends MediaLibrary.Asset {
  score?: number;
  localUri?: string | null;
}

const BlurryPhotos = ({ onBack }: { onBack: () => void }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  // Current page/batch of analyzed assets (max 20)
  const [batchAssets, setBatchAssets] = useState<AssetWithScore[]>([]);
  const [scanningProgress, setScanningProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  // Samples and pagination removed for simplified UX
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AssetWithScore | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  // Pinch-to-zoom values (base * pinch)
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const previewScale = Animated.multiply(baseScale, pinchScale);
  const previewTranslateX = useRef(new Animated.Value(0)).current;
  const previewTranslateY = useRef(new Animated.Value(0)).current;
  const pScaleRef = useRef(1);
  const [pIsZooming, setPIsZooming] = useState(false);
  const [pInitialDistance, setPInitialDistance] = useState(0);
  const [pInitialScale, setPInitialScale] = useState(1);
  const lastTapRef = useRef<number>(0);
  const baseScaleRef = useRef(1);
  const pinchScaleRef = useRef(1);
  // Scanning always uses thumbnails for speed; no scan mode UI
  // List size controls were removed per UX change; using a fixed comfortable size
  // Simplified: no pagination, scan entire library by default
  // Slider position (0..100). We map to effective percentile (80%..10%) so:
  // left (0) = Less blurry (more inclusive, ~80%), right (100) = More blurry (strict, ~10%).
  const [blurPercentile, setBlurPercentile] = useState<number>(70);
  // Deleted toast animation
  const deletedToastOpacity = useRef(new Animated.Value(0)).current;

  const LocalSlider = ({ value, onChange, min = 10, max = 80, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; }) => {
    const [trackWidth, setTrackWidth] = useState(0);
    const [internal, setInternal] = useState(value);
    const internalRef = useRef(value);
    const setInternalVal = (v: number) => {
      internalRef.current = v;
      setInternal(v);
    };
    const touchRef = useRef<View>(null);
    useEffect(() => setInternal(value), [value]);
    const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
    const toValue = (x: number, width: number = trackWidth) => {
      if (width <= 0) return value;
      const ratio = clamp(x / width, 0, 1);
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      return clamp(snapped, min, max);
    };
    const startRef = useRef<{ x0: number; v0: number; w: number } | null>(null);
    const pan = React.useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (evt) => {
          const apply = (w: number) => {
            const x = evt.nativeEvent.locationX;
            const v = toValue(x, w);
            console.log('[Slider] grant x=', evt.nativeEvent.locationX, 'trackWidth=', w, '->', v);
            setTrackWidth(w);
            setInternalVal(v);
            startRef.current = { x0: x, v0: v, w };
          };
          if (trackWidth > 0) {
            apply(trackWidth);
          } else if (touchRef.current) {
            // measure synchronously into callback
            // @ts-ignore RN measure signature
            touchRef.current.measure((x, y, w) => apply(w));
          }
        },
        onPanResponderMove: (evt) => {
          const moveWith = (w: number) => {
            const start = startRef.current;
            const x = evt.nativeEvent.locationX;
            if (start) {
              const dx = x - start.x0;
              const ratioDelta = dx / w;
              const valueDelta = ratioDelta * (max - min);
              const raw = start.v0 + valueDelta;
              const snapped = Math.round(raw / step) * step;
              const clamped = Math.max(min, Math.min(max, snapped));
              setInternalVal(clamped);
            } else {
              const v = toValue(x, w);
              setInternalVal(v);
            }
          };
          if (trackWidth > 0) moveWith(trackWidth);
          else if (touchRef.current) {
            // @ts-ignore
            touchRef.current.measure((x, y, w) => {
              setTrackWidth(w);
              moveWith(w);
            });
          }
        },
        onPanResponderRelease: () => {
          onChange(internalRef.current);
        },
        onPanResponderTerminate: () => {
          onChange(internalRef.current);
        },
        onPanResponderTerminationRequest: () => false,
      })
    ).current;
    const pct = trackWidth > 0 ? ((internal - min) / (max - min)) : 0;
    const thumbLeft = trackWidth * pct;
    return (
      <View
        style={styles.sliderContainer}
        collapsable={false}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          if (w && Math.abs(w - trackWidth) > 1) setTrackWidth(w);
        }}
      >
        <View
          style={styles.sliderTouchArea}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w && Math.abs(w - trackWidth) > 1) setTrackWidth(w);
          }}
          ref={touchRef}
          {...pan.panHandlers}
          hitSlop={{ top: 12, bottom: 12 }}
        >
          <View style={styles.sliderTrack} pointerEvents="none" />
          <View style={[styles.sliderFill, { width: Math.max(0, thumbLeft) }]} pointerEvents="none" />
          <View style={[styles.sliderThumb, { left: Math.max(0, thumbLeft - 10) }]} pointerEvents="none" />
        </View>
      </View>
    );
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await scanEntireLibrary(true);
      setLoading(false);
    })();
  }, []);

  // No scan mode or page-size persistence; defaults are used

  // Sample data removed for simplified UX

  const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, Math.round(progress * 100)))}%` }]} />
    </View>
  );

  const requestPermissions = async () => {
    // Request with write access to support deletions and improve access to local URIs
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    return status === 'granted';
  };

  const analyzeJpegBase64 = async (base64: string) => {
    try {
      const { default: jpeg } = await import('jpeg-js');
      const buffer = Buffer.from(base64, 'base64');
      const raw = jpeg.decode(buffer, { useTArray: true } as any);
      const { width, height, data } = raw;

      // Simple sharpness heuristic: compute average gradient magnitude
      let sum = 0;
      let count = 0;
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          const iRight = (y * width + (x + 1)) * 4;
          const r2 = data[iRight];
          const g2 = data[iRight + 1];
          const b2 = data[iRight + 2];
          const lumR = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

          const iDown = ((y + 1) * width + x) * 4;
          const r3 = data[iDown];
          const g3 = data[iDown + 1];
          const b3 = data[iDown + 2];
          const lumD = 0.299 * r3 + 0.587 * g3 + 0.114 * b3;

          const dx = lum - lumR;
          const dy = lum - lumD;
          const grad = Math.sqrt(dx * dx + dy * dy);
          sum += grad;
          count++;
        }
      }

      const avg = sum / Math.max(1, count);
      return avg; // higher = sharper
    } catch (e) {
      return 0;
    }
  };

  // Score asset using thumbnail-sized analysis
  const scoreAsset = async (asset: AssetWithScore): Promise<number> => {
    try {
      const uri = await resolveMediaUri(asset) || asset.localUri || asset.uri;
      if (!uri) return 0;
      asset.localUri = uri;
      const targetWidth = 256;
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: targetWidth } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
  const b64 = manipulated.base64 || null;
  return b64 && b64.startsWith('/9j/') ? await analyzeJpegBase64(b64) : 0;
    } catch (e) {
      return 0;
    }
  };

  // analyzeAsset not needed; scoreAsset covers thumbnail scoring

  // Removed paged library loader; full library scan provided below

  const handleDelete = async (asset: AssetWithScore) => {
    // If this is a sample (not in MediaLibrary), just remove from view
    if (String(asset.id).startsWith('sample-')) {
      setBatchAssets(prev => prev.filter(a => a.id !== asset.id));
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      return;
    }
    try {
      await MediaLibrary.deleteAssetsAsync([asset.id]);
      // Prune from shared cache as well
      try { MediaCache.removeByIds([asset.id]); } catch {}
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      try {
        deletedToastOpacity.setValue(0);
        Animated.sequence([
          Animated.timing(deletedToastOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.delay(700),
          Animated.timing(deletedToastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start();
      } catch {}
      setBatchAssets(prev => prev.filter(a => a.id !== asset.id));
    } catch (e) {
      Alert.alert('Delete failed', 'Could not delete photo');
    }
  };

  const openPreview = async (asset: AssetWithScore) => {
    setPreviewAsset(asset);
    setPreviewVisible(true);
    try {
      const uri = await resolveMediaUri(asset);
      const candidate = uri || asset.localUri || asset.uri || null;
      const valid = candidate && (candidate.startsWith('file:') || candidate.startsWith('http') || candidate.startsWith('data:'));
      setPreviewUri(valid ? candidate : null);
    } catch {
      const candidate = asset.localUri || asset.uri || null;
      const valid = candidate && (candidate.startsWith('file:') || candidate.startsWith('http') || candidate.startsWith('data:'));
      setPreviewUri(valid ? candidate : null);
    }
    // reset transforms
    baseScaleRef.current = 1; baseScale.setValue(1);
    pinchScaleRef.current = 1; pinchScale.setValue(1);
    previewTranslateX.setValue(0);
    previewTranslateY.setValue(0);
    setPIsZooming(false);
    setPInitialDistance(0);
    setPInitialScale(1);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewAsset(null);
    setPreviewUri(null);
  };

  const handleSharePreview = async () => {
    if (!previewAsset) return;
    try {
      const isAvail = await Sharing.isAvailableAsync();
      if (!isAvail) {
        Alert.alert('Share Not Available', 'Photo sharing is not available on this device.');
        return;
      }
      let shareUri: string | null = previewUri || previewAsset.localUri || previewAsset.uri || null;
      const isValid = (u: string | null) => !!u && (u.startsWith('file:') || u.startsWith('http') || u.startsWith('data:'));
      if (!isValid(shareUri)) {
        const resolved = await resolveMediaUri(previewAsset);
        shareUri = resolved || previewAsset.uri || null;
      }
      if (!isValid(shareUri)) {
        Alert.alert('Share Error', 'Could not access this photo to share.');
        return;
      }
      await Sharing.shareAsync(shareUri as string, {
        dialogTitle: 'Share Photo',
        mimeType: Platform.select({ ios: 'public.image', android: 'image/*', default: 'image/*' }) as any,
        UTI: 'public.image',
      });
    } catch (e) {
      console.warn('Share failed', e);
      Alert.alert('Error', 'Unable to share photo.');
    }
  };

  // Pinch-to-zoom helpers for preview
  const pGetDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const previewPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // Only handle panning when already zoomed; pinch handled by RNGH
        return pScaleRef.current > 1.01;
      },
      onStartShouldSetPanResponderCapture: (evt) => {
        return pScaleRef.current > 1.01;
      },
      onMoveShouldSetPanResponder: (evt) => {
        // Activate when zoomed for panning
        return pScaleRef.current > 1.01;
      },
      onMoveShouldSetPanResponderCapture: (evt) => {
        return pScaleRef.current > 1.01;
      },
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        // Handle double-tap to zoom
        if (touches.length === 1) {
          const now = Date.now();
          const delta = now - lastTapRef.current;
          lastTapRef.current = now;
          if (delta < 250) {
            // Double-tap: toggle between 1x and 2x
            const target = pScaleRef.current > 1.05 ? 1 : 2;
            baseScaleRef.current = target;
            baseScale.setValue(target);
            pinchScaleRef.current = 1;
            pinchScale.setValue(1);
            pScaleRef.current = target;
            Animated.parallel([
              Animated.spring(previewTranslateX, { toValue: 0, useNativeDriver: true }),
              Animated.spring(previewTranslateY, { toValue: 0, useNativeDriver: true }),
            ]).start();
            return;
          }
        }
      },
      onPanResponderMove: (evt, gesture) => {
        if (pScaleRef.current > 1) {
          // pan when zoomed in
          previewTranslateX.setValue(gesture.dx * 0.6);
          previewTranslateY.setValue(gesture.dy * 0.6);
        }
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderRelease: () => {
        setPIsZooming(false);
        // snap close to 1 back to 1
        const cur = baseScaleRef.current * pinchScaleRef.current;
        if (Math.abs(cur - 1) < 0.05) {
          baseScaleRef.current = 1; baseScale.setValue(1);
          pinchScaleRef.current = 1; pinchScale.setValue(1);
          Animated.parallel([
            Animated.spring(previewTranslateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(previewTranslateY, { toValue: 0, useNativeDriver: true }),
          ]).start();
          pScaleRef.current = 1;
        }
      },
    })
  ).current;
  
  // Pinch gesture events (RNGH)
  const onPinchEvent = Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true });
  const onPinchStateChange = (e: any) => {
    const s = e.nativeEvent.state;
    if (s === State.END || s === State.CANCELLED || s === State.FAILED) {
      let next = baseScaleRef.current * pinchScaleRef.current;
      next = Math.max(1, Math.min(4, next));
      baseScaleRef.current = next;
      baseScale.setValue(next);
      pinchScaleRef.current = 1;
      pinchScale.setValue(1);
      pScaleRef.current = next;
    } else if (s === State.ACTIVE) {
      // read current pinch scale
      // cannot read from Animated directly; approximate using last known ref if present
    }
  };

  // Left-edge swipe back gesture (must be declared outside JSX to avoid conditional hooks)
  const edgeSwipePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.pageX < 24,
      onMoveShouldSetPanResponder: (evt, gesture) => evt.nativeEvent.pageX < 24 && Math.abs(gesture.dx) > 10,
      onPanResponderRelease: (evt, gesture) => {
        if (evt.nativeEvent.pageX < 60 && gesture.dx > 60 && Math.abs(gesture.dy) < 30) {
          onBack();
        }
      },
    })
  ).current;

  // Toggle selection for bulk delete; clicking row 'Delete' will select/deselect
  const toggleSelect = (asset: AssetWithScore) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id);
      return next;
    });
  };

  const bulkDeleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const ok = await new Promise<boolean>((resolve) => {
      Alert.alert(
        `Delete ${ids.length} photos?`,
        'This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });
    if (!ok) return;
    try {
      await MediaLibrary.deleteAssetsAsync(ids);
      try { MediaCache.removeByIds(ids); } catch {}
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      setBatchAssets(prev => prev.filter(a => !selected.has(a.id)));
      setSelected(new Set());
      try {
        deletedToastOpacity.setValue(0);
        Animated.sequence([
          Animated.timing(deletedToastOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.delay(900),
          Animated.timing(deletedToastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start();
      } catch {}
    } catch (e) {
      Alert.alert('Delete failed', 'Could not delete selected photos');
    }
  };

  // Scan the entire photo library across pages, aggregate and sort
  const scanEntireLibrary = async (useCacheFirst: boolean = false) => {
    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('Permission required', 'Photo library permission is required to scan the library.');
      return;
    }
    setLoading(true);
    try {
      const { photos } = useCacheFirst ? await MediaCache.getOrScan(p => setScanningProgress(p)) : await MediaCache.refresh(p => setScanningProgress(p));
      const aggregated: AssetWithScore[] = [];
      setScanningProgress({ done: 0, total: photos.length });
      for (let i = 0; i < photos.length; i++) {
        const a = photos[i] as any as AssetWithScore;
        const score = await scoreAsset(a);
        a.score = score;
        aggregated.push(a);
        setScanningProgress({ done: i + 1, total: photos.length });
        if ((i + 1) % 10 === 0) await new Promise(r => setTimeout(r, 0));
      }
      aggregated.sort((a, b) => (a.score || 0) - (b.score || 0));
  setBatchAssets(aggregated);
    } catch (e) {
      console.warn('Full scan failed', e);
      Alert.alert('Scan failed', 'Could not scan the entire library.');
    } finally {
      setLoading(false);
    }
  };

  // Sample scan removed

  const renderItem = ({ item }: { item: AssetWithScore }) => {
    const local = (item as AssetWithScore).localUri || null;
    const fallbackUri = item.uri && (item.uri.startsWith('file:') || item.uri.startsWith('http')) ? item.uri : null;
    const displayUri = local || fallbackUri;
    const isSelected = selected.has(item.id);
    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => openPreview(item)}>
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={styles.thumb} />
          ) : (
            <Image source={require('../assets/app_icon_photo_picks.png')} style={styles.thumb} />
          )}
        </TouchableOpacity>
        <View style={styles.cardBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => openPreview(item)}>
                <Text numberOfLines={1} style={styles.filename}>{item.filename || item.id}</Text>
                <Text style={styles.score}>Sharpness: {(item.score || 0).toFixed(2)}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.delete, isSelected && styles.deleteSelected]}
              onPress={() => toggleSelect(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.deleteText}>{isSelected ? 'Selected' : 'Delete'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // No rescore-on-mode-change needed

  const displayedAssets = useMemo(() => {
    if (!batchAssets || batchAssets.length === 0) return [] as AssetWithScore[];
    // batchAssets should already be sorted ascending by score (lower = blurrier)
    const n = batchAssets.length;
    // Map slider value (0..100) to effective percentile 80..10 (Less..More blurry)
    const minPct = 10, maxPct = 80;
    const v = Math.max(0, Math.min(100, blurPercentile));
    const effPct = maxPct - (v / 100) * (maxPct - minPct);
    const pct = effPct / 100;
    const cutoff = Math.max(1, Math.min(n, Math.floor(n * pct)));
    return batchAssets.slice(0, cutoff);
  }, [batchAssets, blurPercentile]);

  // Match Swipe Photos: show only the loading indicator first
  if (loading) {
    const total = scanningProgress.total;
    const done = scanningProgress.done;
    const ratio = total > 0 ? done / total : 0;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>
          {total > 0 ? `Scanning ${done}/${total}` : `Scanning ${done}`}
        </Text>
        <ProgressBar progress={ratio} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        <LinearGradient colors={["rgba(15,20,34,1)", "rgba(10,14,26,0.0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.headerGradient} />
        <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => { console.log('[BlurryPhotos] Back pressed'); onBack(); }}
          style={styles.backButton}
          activeOpacity={0.85}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>{'← Back'}</Text>
        </TouchableOpacity>
        <View>
          {selected.size > 0 && (
            <TouchableOpacity onPress={bulkDeleteSelected} activeOpacity={0.85} style={{ padding: 6 }}>
              <Text style={{ color: '#ff6b6b', fontWeight: '700' }}>Delete ({selected.size})</Text>
            </TouchableOpacity>
          )}
        </View>
        </View>
      </View>

      {/* Title to match Swipe Photos */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Blurry Photos Organizer</Text>
      </View>

      <View style={styles.controlsBox}>
        {/* Only keep the slider */}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Less blurry</Text>
          <LocalSlider value={blurPercentile} onChange={setBlurPercentile} min={0} max={100} step={1} />
          <Text style={styles.sliderLabel}>More blurry</Text>
        </View>
      </View>

      {/* Loading UI handled via early return above to match Swipe Photos */}
    
      {!loading && displayedAssets.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No photos found or scanning not complete.</Text>
        </View>
      )}

      {/* Deleted toast */}
      <Animated.View style={{ position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(10,14,26,0.9)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, opacity: deletedToastOpacity }} pointerEvents="none">
        <Text style={{ color: '#ff6b6b', fontWeight: '700', letterSpacing: 0.5 }}>Deleted</Text>
      </Animated.View>

      <FlatList
        style={{ flex: 1 }}
        data={displayedAssets}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await scanEntireLibrary(); setRefreshing(false); }} tintColor="#7c3aed" />}
        // No footer; use the Scan Entire Library button above instead
      />

      {/* Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={closePreview}>
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={[styles.modalContent, { paddingTop: insets.top }]}> 
            <View style={[styles.modalHeader, { paddingTop: Math.max(12, insets.top ? 8 : 12) }]}> 
              <TouchableOpacity onPress={closePreview} style={styles.modalClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={{ color: '#cbd5e1', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text numberOfLines={1} style={styles.modalTitle}>{previewAsset?.filename || previewAsset?.id || 'Photo'}</Text>
              </View>
              <TouchableOpacity style={styles.modalShareBtn} onPress={handleSharePreview} activeOpacity={0.85}>
                <LinearGradient colors={["#4f46e5", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalShareBtnBg}>
                  <Text style={styles.modalShareBtnText}>Share</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.modalImageWrap} collapsable={false} {...previewPanResponder.panHandlers}>
              {previewUri ? (
                <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
                  <Animated.View
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: [
                        { translateX: previewTranslateX },
                        { translateY: previewTranslateY },
                        { scale: previewScale },
                      ],
                    }}
                    collapsable={false}
                  >
                    <Image source={{ uri: previewUri }} style={styles.modalImage} resizeMode="contain" />
                  </Animated.View>
                </PinchGestureHandler>
              ) : (
                <ActivityIndicator size="large" color="#7c3aed" />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Left-edge swipe back gesture area */}
      <View
        style={styles.edgeSwipeArea}
        {...edgeSwipePan.panHandlers}
        pointerEvents="box-only"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e1a' },
  headerWrapper: { position: 'relative' },
  headerGradient: { ...StyleSheet.absoluteFillObject },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backButton: { padding: 8 },
  backText: { color: '#a78bfa' },
  header: { color: '#fff', fontSize: 18, fontWeight: '600' },
  // Title to match Swipe Photos
  titleContainer: { alignItems: 'center', paddingBottom: 20 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  loader: { alignItems: 'center', marginTop: 24 },
  // Loading text aligned to Swipe Photos style
  loadingText: { color: '#ffffff', fontSize: 18, textAlign: 'center' },
  progressText: { color: '#a0aec0', marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#a0aec0' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: { flexDirection: 'row', backgroundColor: '#11151f', borderRadius: 12, padding: 12, marginBottom: 12, width: '100%' },
  cardSelected: { borderWidth: 1, borderColor: '#ff6b6b55' },
  thumb: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#222' },
  cardBody: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  filename: { color: '#fff', fontWeight: '600' },
  score: { color: '#9aa5b1' },
  actions: { flexDirection: 'row' },
  delete: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#2b3247', borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: '#3a445f' },
  deleteSelected: { backgroundColor: '#ff6b6b' },
  deleteText: { color: '#fff' },
  progressBarContainer: { height: 8, backgroundColor: '#1a2030', borderRadius: 4, overflow: 'hidden', marginTop: 8, width: '90%' },
  progressBarFill: { height: 8, backgroundColor: '#7c3aed' },
  // Blur sensitivity controls
  controlsBox: { paddingHorizontal: 16, paddingBottom: 8 },
  controlsLabel: { color: '#cbd5e1', marginBottom: 8, fontSize: 12 },
  modeSubtitle: { color: '#9aa5b1', marginTop: 2, marginBottom: 8, fontSize: 12 },
  // Slider-based controls
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  sliderLabel: { color: '#cbd5e1', fontSize: 12, marginHorizontal: 8 },
  slider: { flex: 1, height: 32 },
  sliderHelper: { color: '#6b7280', marginTop: 6 },
  sliderContainer: { flex: 1, height: 36, justifyContent: 'center', paddingVertical: 6, width: '100%' },
  sliderTouchArea: { flex: 1, justifyContent: 'center', width: '100%', position: 'relative' },
  sliderTrack: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: '#2a3348', left: 0, right: 0 },
  sliderFill: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: '#7c3aed', left: 0 },
  sliderThumb: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#7c3aed' },
  sliderAxisHint: { color: '#6b7280', textAlign: 'center', marginTop: 4 },
  // Segmented control styles
  segmentRow: { flexDirection: 'row', backgroundColor: '#0f1422', borderRadius: 12, padding: 3, marginBottom: 8, alignSelf: 'stretch', borderWidth: StyleSheet.hairlineWidth, borderColor: '#1f2740' },
  segmentItem: { paddingVertical: 0, paddingHorizontal: 0, borderRadius: 9, flex: 1, alignItems: 'center', overflow: 'hidden' },
  segmentActiveBg: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 9, width: '100%', alignItems: 'center' },
  segmentText: { color: '#b8c1d1', fontSize: 12, paddingVertical: 10, paddingHorizontal: 12, width: '100%', textAlign: 'center' },
  segmentTextActive: { color: '#ffffff', fontWeight: '700' },
  // Modal preview styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  modalClose: { padding: 6 },
  modalTitle: { color: '#e5e7eb', fontSize: 16, fontWeight: '600' },
  modalShareBtn: { borderRadius: 18, overflow: 'hidden' },
  modalShareBtnBg: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  modalShareBtnText: { color: '#fff', fontWeight: '700' },
  modalImageWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 24 },
  modalImage: { width: '100%', height: '100%' },
  edgeSwipeArea: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 24, backgroundColor: 'transparent' },
});

export default BlurryPhotos;
