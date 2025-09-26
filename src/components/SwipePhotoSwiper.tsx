import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Dimensions,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// Pinch-to-zoom removed for the swipe page
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system/legacy';
import resolveMediaUri from '../utils/resolveMediaUri';
import * as Haptics from 'expo-haptics';
import { MediaCache } from '../utils/mediaCache';

// Toast timing constants (ms)
const TOAST_FADE_IN = 120;
const TOAST_VISIBLE_MS = 700;
const TOAST_FADE_OUT = 180;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Photo {
  uri: string;
  filename?: string | null;
  id: string;
  mediaType?: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
}

interface SwipePhotoSwiperProps {
  onPhotoAction: (action: 'keep' | 'delete' | 'edit', photo: Photo) => void;
  onBack: () => void;
}

const SwipePhotoSwiper: React.FC<SwipePhotoSwiperProps> = ({ onPhotoAction, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [resolvedUris, setResolvedUris] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanningProgress, setScanningProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [keptCount, setKeptCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [photosMarkedForDeletion, setPhotosMarkedForDeletion] = useState<Photo[]>([]); // Track photos marked for deletion
  // Favorites removed for now
  const keptToastOpacity = useRef(new Animated.Value(0)).current;
  const deletedToastOpacity = useRef(new Animated.Value(0)).current;
  
  const translateX = useRef(new Animated.Value(0)).current; // swipe X
  const translateY = useRef(new Animated.Value(0)).current; // swipe Y (rare)
  const rotation = useRef(new Animated.Value(0)).current;
  const nextPhotoScale = useRef(new Animated.Value(0.9)).current;
  // Haptic on threshold crossing
  const hasCrossedThresholdRef = useRef(false);
  
  // Zoom removed: no pinch or double-tap state

  useEffect(() => {
    console.log('Loading device photos (cache-aware)');
    loadDevicePhotos();
  }, []);

  // Debug: Log when photos state changes
  useEffect(() => {
    console.log(`Photos state changed: now ${photos.length} photos`);
  }, [photos]);

  // Favorites removed: no favorite status tracking

  const handleBackPress = () => {
    if (photosMarkedForDeletion.length > 0) {
      Alert.alert(
        'Confirm Deletions',
        `You have ${photosMarkedForDeletion.length} photo${photosMarkedForDeletion.length > 1 ? 's' : ''} marked for deletion. What would you like to do?`,
        [
          { 
            text: `Delete ${photosMarkedForDeletion.length} Now`, 
            style: 'destructive',
            onPress: () => confirmDeletions()
          },
          { 
            text: 'Nevermind', 
            onPress: () => {
              // Clear marked photos and go back without deleting
              setPhotosMarkedForDeletion([]);
              onBack();
            }
          }
        ]
      );
    } else {
      onBack();
    }
  };

  const confirmDeletions = async () => {
    try {
      if (photosMarkedForDeletion.length > 0) {
        await MediaLibrary.deleteAssetsAsync(photosMarkedForDeletion.map(photo => photo.id));
        console.log(`Deleted ${photosMarkedForDeletion.length} photos`);
        // Keep shared cache in sync
        try { MediaCache.removeByIds(photosMarkedForDeletion.map(p => p.id)); } catch {}
      }
      
      Alert.alert(
        'Success',
        `${photosMarkedForDeletion.length} photo${photosMarkedForDeletion.length > 1 ? 's' : ''} deleted successfully.`,
        [{ text: 'OK', onPress: () => {
          // Clear marked photos and go back
          setPhotosMarkedForDeletion([]);
          onBack();
        }}]
      );
    } catch (error) {
      console.error('Error deleting photos:', error);
      Alert.alert(
        'Error',
        'Some photos could not be deleted. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadDevicePhotos = async () => {
    try {
      // Request permissions with proper write access for deletion
      const permissionResult = await MediaLibrary.requestPermissionsAsync(true);
      console.log('Permissions granted:', permissionResult);
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to organize them.', [{ text: 'OK' }]);
        setPhotos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setScanningProgress({ done: 0, total: 0 });
      const { photos: cachedPhotos, resolvedUris } = await MediaCache.getOrScan(p => setScanningProgress(p));
      if (!cachedPhotos || cachedPhotos.length === 0) {
        Alert.alert('No Photos Found', 'No photos were found on your device.', [{ text: 'OK' }]);
        setPhotos([]);
        setLoading(false);
        return;
      }
      const mapped: Photo[] = cachedPhotos.map(p => ({
        id: p.id,
        uri: resolvedUris[p.id] || p.uri,
        filename: p.filename,
        mediaType: p.mediaType as any,
        width: p.width,
        height: p.height,
        creationTime: p.creationTime,
        modificationTime: p.modificationTime,
      }));
      setPhotos(mapped);
      setResolvedUris({ ...resolvedUris });
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error Loading Photos', 'There was a problem accessing your photo library.', [{ text: 'OK' }]);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeAction = async (direction: 'left' | 'right', fromButton = false) => {
    console.log(`Handle swipe action: direction=${direction}, fromButton=${fromButton}, currentIndex=${currentIndex}, photosLength=${photos.length}`);
    
    if (currentIndex >= photos.length) {
      console.log('No more photos to swipe');
      return;
    }

    const currentPhoto = photos[currentIndex];
    console.log(`Current photo: ${currentPhoto.filename}, id: ${currentPhoto.id}`);
    
    const action = direction === 'left' ? 'delete' : 'keep';
    console.log(`Action: ${action}`);
    // Haptic feedback
    try {
      if (action === 'delete') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    
    // Update counters
    if (action === 'delete') {
      setDeletedCount(prev => {
        console.log(`Updating deleted count from ${prev} to ${prev + 1}`);
        return prev + 1;
      });
      
      // Add to marked for deletion
      setPhotosMarkedForDeletion(prev => [...prev, currentPhoto]);
      console.log(`Photo marked for deletion: ${currentPhoto.filename}`);
      // Show compact 'Deleted' toast
      try {
        deletedToastOpacity.setValue(0);
        Animated.sequence([
          Animated.timing(deletedToastOpacity, { toValue: 1, duration: TOAST_FADE_IN, useNativeDriver: true }),
          Animated.delay(TOAST_VISIBLE_MS),
          Animated.timing(deletedToastOpacity, { toValue: 0, duration: TOAST_FADE_OUT, useNativeDriver: true }),
        ]).start();
      } catch {}
    } else {
      setKeptCount(prev => {
        console.log(`Updating kept count from ${prev} to ${prev + 1}`);
        return prev + 1;
      });
      try {
        keptToastOpacity.setValue(0);
        Animated.sequence([
          Animated.timing(keptToastOpacity, { toValue: 1, duration: TOAST_FADE_IN, useNativeDriver: true }),
          Animated.delay(TOAST_VISIBLE_MS),
          Animated.timing(keptToastOpacity, { toValue: 0, duration: TOAST_FADE_OUT, useNativeDriver: true }),
        ]).start();
      } catch {}
    }
    
    onPhotoAction(action, currentPhoto);
    
    const targetX = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    
    // Animate current photo out and next photo in
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: fromButton ? targetX * 1.5 : targetX,
        duration: fromButton ? 400 : 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: direction === 'right' ? 30 : -30,
        duration: fromButton ? 400 : 300,
        useNativeDriver: true,
      }),
      Animated.timing(nextPhotoScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next photo and reset animations
      setCurrentIndex(prev => prev + 1);
      translateX.setValue(0);
      translateY.setValue(0);
      rotation.setValue(0);
      nextPhotoScale.setValue(0.9);
    });
  };

  const handleEditPhoto = async () => {
    if (currentIndex >= photos.length) return;
    
    const currentPhoto = photos[currentIndex];
    onPhotoAction('edit', currentPhoto);
    
    try {
      // No sample photo branch

      if (Platform.OS === 'ios') {
        // iOS: Go directly to share dialog
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Ensure we pass a file:// or http(s) URI, not ph://
          let shareUri = currentPhoto.uri;
          try {
      // Update cache to remove deleted items
      MediaCache.removeByIds(photosMarkedForDeletion.map(p => p.id));
            const resolved = await resolveMediaUri(currentPhoto);
            shareUri = resolved || currentPhoto.uri;
          } catch (e) {
            // ignore and use currentPhoto.uri
          }

          await Sharing.shareAsync(shareUri, {
            dialogTitle: 'Share Photo',
            mimeType: 'image/png',
            UTI: 'public.image',
          });
        } else {
          Alert.alert('Share Not Available', 'Photo sharing is not available.');
        }
      } else {
        // Android: Show options dialog for editing
        Alert.alert(
          'Edit Photo',
          'Choose how you want to edit this photo:',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Share to Apps', 
              onPress: async () => {
                try {
                  const isAvailable = await Sharing.isAvailableAsync();
                    if (isAvailable) {
                      let shareUri = currentPhoto.uri;
                      try {
                        const resolved = await resolveMediaUri(currentPhoto);
                        shareUri = resolved || currentPhoto.uri;
                      } catch (e) {}

                      await Sharing.shareAsync(shareUri, {
                      dialogTitle: 'Choose App',
                      mimeType: 'image/png',
                      UTI: 'public.image',
                    });
                  } else {
                    Alert.alert('Share Not Available', 'Photo sharing is not available.');
                  }
                } catch (error) {
                  console.error('Error sharing photo:', error);
                  Alert.alert('Error', 'Unable to share photo.');
                }
              }
            },
            { 
              text: 'Edit Photo', 
              onPress: async () => {
                try {
                  const isAvailable = await Sharing.isAvailableAsync();
                    if (isAvailable) {
                      let shareUri = currentPhoto.uri;
                      try {
                        const resolved = await resolveMediaUri(currentPhoto);
                        shareUri = resolved || currentPhoto.uri;
                      } catch (e) {}

                      await Sharing.shareAsync(shareUri, {
                      dialogTitle: 'Choose Photo Editor',
                      mimeType: 'image/png',
                      UTI: 'public.image',
                    });
                  } else {
                    Alert.alert('Edit Not Available', 'Photo editing is not available.');
                  }
                } catch (error) {
                  console.error('Error editing photo:', error);
                  Alert.alert('Error', 'Unable to edit photo.');
                }
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error opening photo for editing:', error);
      Alert.alert('Error', 'Failed to open photo for editing.');
    }
  };

  // Favorites removed: no toggle handler

  // No zoom helpers on this page

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      const touches = evt.nativeEvent.touches;
      return touches.length === 1;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      if (touches.length !== 1) return false;
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      hasCrossedThresholdRef.current = false;
    },
    onPanResponderMove: (_evt, gestureState) => {
      translateX.setValue(gestureState.dx);
      // Stronger rotation response; final mapping still clamped in interpolate
      rotation.setValue(gestureState.dx);
      // Scale next photo faster using threshold-based progress and allow slight overshoot up to 1.05
      const progress = Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD);
      nextPhotoScale.setValue(0.88 + (progress * 0.17));

      // Haptic feedback when crossing the swipe threshold
      const crossed = Math.abs(gestureState.dx) > SWIPE_THRESHOLD;
      if (crossed && !hasCrossedThresholdRef.current) {
        hasCrossedThresholdRef.current = true;
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      } else if (!crossed && hasCrossedThresholdRef.current) {
        // Reset if user moves back below threshold so they can feel it again if they cross once more
        hasCrossedThresholdRef.current = false;
      }
    },
    onPanResponderRelease: (_evt, gestureState) => {
      console.log(`Pan responder release: dx=${gestureState.dx}, dy=${gestureState.dy}, SWIPE_THRESHOLD=${SWIPE_THRESHOLD}`);
      if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
        const direction = gestureState.dx > 0 ? 'right' : 'left';
        console.log(`Swipe detected! Direction: ${direction}`);
        handleSwipeAction(direction);
      } else {
        console.log('Swipe not strong enough, snapping back');
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(rotation, { toValue: 0, useNativeDriver: true }),
          Animated.spring(nextPhotoScale, { toValue: 0.9, useNativeDriver: true }),
        ]).start();
      }
    },
  });

  const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, Math.round(progress * 100)))}%` }]} />
    </View>
  );

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setScanningProgress({ done: 0, total: 0 });
      const { photos: cachedPhotos, resolvedUris } = await MediaCache.refresh(p => setScanningProgress(p));
      const mapped: Photo[] = cachedPhotos.map(p => ({
        id: p.id,
        uri: resolvedUris[p.id] || p.uri,
        filename: p.filename,
        mediaType: p.mediaType as any,
        width: p.width,
        height: p.height,
        creationTime: p.creationTime,
        modificationTime: p.modificationTime,
      }));
      setPhotos(mapped);
      setResolvedUris({ ...resolvedUris });
      setCurrentIndex(0);
      setPhotosMarkedForDeletion([]);
      setKeptCount(0);
      setDeletedCount(0);
    } finally {
      setLoading(false);
    }
  };

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

  if (photos.length === 0) {
    console.log('No photos found - photos.length is 0');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No photos found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentIndex >= photos.length) {
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completedText}>🎉 All photos reviewed!</Text>
        <Text style={styles.subText}>
          You've swiped through all {photos.length} photos
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{keptCount}</Text>
            <View style={styles.statLabelContainer}>
              <Text style={styles.statLabel}>Kept </Text>
              <Ionicons name="heart" size={16} color="#2ed573" />
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{deletedCount}</Text>
            <View style={styles.statLabelContainer}>
              <Text style={styles.statLabel}>Deleted </Text>
              <Ionicons name="trash" size={16} color="#ff4757" />
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>← Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[currentIndex + 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={["#0f1422", "#0a0e1a"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.headerGradient} />
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButtonSmall, { paddingHorizontal: 12, paddingVertical: 8 }]} onPress={handleBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.85}>
            <Text style={styles.backButtonSmallText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.counter}>
              {currentIndex + 1} / {photos.length}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.miniStatContainer}>
                <Ionicons name="heart" size={12} color="#2ed573" />
                <Text style={styles.miniStat}> {keptCount}</Text>
              </View>
              <View style={styles.miniStatContainer}>
                <Ionicons name="trash" size={12} color="#ff4757" />
                <Text style={styles.miniStat}> {deletedCount}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.85}>
              <Text style={{ color: '#a78bfa' }}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={handleEditPhoto} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.85}>
              <LinearGradient colors={["#4f46e5", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.editButtonBg}>
                <Text style={styles.editButtonText}>
                  {Platform.select({ ios: 'Share', android: 'Share', default: 'Share' })}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Swipe Photo Organizer</Text>
  <Text style={styles.subtitle}>Swipe left to delete • Swipe right to keep</Text>
      </View>

      {/* Photo Stack Container */}
      <View style={styles.photoContainer}>
        <Animated.View style={[styles.keptToast, { opacity: keptToastOpacity }]} pointerEvents="none">
          <Text style={styles.keptToastText}>Kept</Text>
        </Animated.View>
        <Animated.View style={[styles.deletedToast, { opacity: deletedToastOpacity }]} pointerEvents="none">
          <Text style={styles.deletedToastText}>Deleted</Text>
        </Animated.View>
        {/* Next Photo (Background) */}
        {nextPhoto && (
          <Animated.View
            style={[
              styles.photoWrapper,
              styles.nextPhotoWrapper,
              {
                transform: [{ scale: nextPhotoScale }],
              },
            ]}
          >
            <Image source={{ uri: resolvedUris[nextPhoto.id] || nextPhoto.uri }} style={styles.photo} />
          </Animated.View>
        )}
        
        {/* Current Photo */}
        <Animated.View
          style={[
            styles.photoWrapper,
            styles.currentPhotoWrapper,
            {
              transform: [
                { translateX },
                { translateY },
                { rotate: rotation.interpolate({
                    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                    outputRange: ['-18deg', '0deg', '18deg'],
                    extrapolate: 'clamp',
                  })
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: resolvedUris[currentPhoto.id] || currentPhoto.uri }} style={styles.photo} />
          </View>
          
          {/* Filename overlay */}
          <View style={styles.filenameOverlay}>
            <Text style={styles.filenameText}>{currentPhoto.filename}</Text>
          </View>
          
          {/* Swipe indicators */}
          <Animated.View 
            style={[
              styles.deleteIndicator,
              {
                opacity: translateX.interpolate({
                  inputRange: [-200, -50, 0],
                  outputRange: [1, 0.7, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <MaterialIcons name="thumb-down" size={80} color="#ffffff" />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.keepIndicator,
              {
                opacity: translateX.interpolate({
                  inputRange: [0, 50, 200],
                  outputRange: [0, 0.7, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <MaterialIcons name="thumb-up" size={80} color="#ffffff" />
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a', // Deep navy blue background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e1a',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e1a',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
  },
  progressBarContainer: { height: 8, backgroundColor: '#1a2030', borderRadius: 4, overflow: 'hidden', marginTop: 12, width: '70%' },
  progressBarFill: { height: 8, backgroundColor: '#7c3aed' },
  completedText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  subText: {
    color: '#adb5bd',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a202c',
    borderRadius: 15,
    padding: 20,
    marginBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#4a5568',
    marginHorizontal: 20,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#a0aec0',
    fontSize: 14,
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerWrapper: {
    position: 'relative',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerCenter: {
    alignItems: 'center',
  },
  backButtonSmall: {
    padding: 8,
    minWidth: 60,
  },
  backButtonSmallText: {
    color: '#a78bfa',
    fontSize: 16,
  },
  editButton: {
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    overflow: 'hidden',
  },
  editButtonBg: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  counter: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  miniStat: {
    color: '#a0aec0',
    fontSize: 12,
  },
  miniStatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  
  titleContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#a78bfa',
    fontSize: 14,
    marginTop: 5,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  photoWrapper: {
    width: SCREEN_WIDTH - 32, // full width minus 16dp padding each side
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 20,
    overflow: 'hidden',
  shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  nextPhotoWrapper: {
    position: 'absolute',
    zIndex: 1,
  },
  currentPhotoWrapper: {
    zIndex: 2,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  keptToast: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(10,14,26,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 10,
  },
  keptToastText: {
    color: '#2ed573',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deletedToast: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(10,14,26,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 10,
    marginTop: 8,
  },
  deletedToastText: {
    color: '#ff4757',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filenameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filenameText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteIndicator: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    backgroundColor: 'rgba(255, 71, 87, 0.9)',
    padding: 20,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -60 }, { translateY: -60 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  keepIndicator: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    backgroundColor: 'rgba(46, 213, 115, 0.9)',
    padding: 20,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -60 }, { translateY: -60 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  indicatorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    paddingBottom: 50,
  },
  instructionsText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 2,
  },
  backButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SwipePhotoSwiper;
