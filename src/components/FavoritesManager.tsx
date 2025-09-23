import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import resolveMediaUri from '../utils/resolveMediaUri';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 16dp side padding + 16dp gutter between two items -> total horizontal gutters = 16 + 16 + 16 = 48
const ITEM_GUTTER = 16;
const H_PADDING = 16;
const ITEM_WIDTH = (SCREEN_WIDTH - (H_PADDING * 2) - ITEM_GUTTER) / 2;

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

interface FavoritesManagerProps {
  onBack: () => void;
  onStartSwiping: () => void;
}

const FavoritesManager: React.FC<FavoritesManagerProps> = ({ onBack, onStartSwiping }) => {
  const [favoritePhotos, setFavoritePhotos] = useState<Photo[]>([]);
  const [localUris, setLocalUris] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // Get favorite photo IDs from AsyncStorage
      const favoritesJson = await AsyncStorage.getItem('favoritePhotos');
      const favoriteIds: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
      
      console.log(`Loading ${favoriteIds.length} favorite photos`);
      
      if (favoriteIds.length === 0) {
        setFavoritePhotos([]);
        setLoading(false);
        return;
      }

      // Check permissions
      const permissionResult = await MediaLibrary.requestPermissionsAsync(true);
      if (permissionResult.status !== 'granted') {
        console.log('Permission denied for favorites');
        Alert.alert('Permission Required', 'We need access to your photos to show favorites.');
        setFavoritePhotos([]);
        return;
      }

      // Get actual photos from MediaLibrary
      const photos: Photo[] = [];
      for (const id of favoriteIds) {
        try {
          {
            // Handle real photos
            const assetInfo = await MediaLibrary.getAssetInfoAsync(id);
            const photo: Photo = {
              uri: assetInfo.localUri || assetInfo.uri,
              filename: assetInfo.filename,
              id: id,
              mediaType: assetInfo.mediaType,
              width: assetInfo.width,
              height: assetInfo.height,
              creationTime: assetInfo.creationTime || Date.now(),
              modificationTime: assetInfo.modificationTime || Date.now()
            };
            photos.push(photo);
          }
        } catch (error) {
          console.warn(`Could not load favorite photo ${id}:`, error);
          // Remove this ID from favorites since it no longer exists
          await removeFavoriteById(id);
        }
      }

      // Sort by creation time (newest first)
      photos.sort((a, b) => b.creationTime - a.creationTime);
      
      setFavoritePhotos(photos);
      // Resolve any ph:// URIs to local file URIs when possible
      resolveLocalUris(photos);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorite photos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveLocalUris = async (photos: Photo[]) => {
    const map: Record<string, string> = {};
    for (const p of photos) {
      try {
        if (!p.uri) continue;
        const resolved = await resolveMediaUri(p.uri || p);
        if (resolved) map[p.id] = resolved;
        else map[p.id] = p.uri;
      } catch (e) {
        map[p.id] = p.uri;
      }
    }
    setLocalUris(map);
  };

  const validatePreviewUri = (u: string | null | undefined): string | null => {
    if (!u) return null;
    if (u.startsWith('file://') || u.startsWith('http') || u.startsWith('https') || u.startsWith('data:')) return u;
    return null;
  };

  const openPreview = async (photo: Photo) => {
    try {
      setPreviewPhoto(photo);
      setPreviewUri(null);
      setPreviewVisible(true);
      let uri = localUris[photo.id] || photo.uri;
      try {
        const resolved = await resolveMediaUri(photo);
        if (resolved) uri = resolved;
      } catch {}
      const valid = validatePreviewUri(uri);
      setPreviewUri(valid);
    } catch (e) {
      console.warn('Failed to open preview', e);
      setPreviewVisible(false);
    }
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewPhoto(null);
    setPreviewUri(null);
  };

  const handleSharePreview = async () => {
    try {
      if (!previewUri) {
        Alert.alert('Share Unavailable', 'No image to share.');
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Share Not Available', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(previewUri, { dialogTitle: 'Share Photo', mimeType: 'image/*' });
    } catch (e) {
      console.error('Share failed', e);
      Alert.alert('Error', 'Unable to share this photo.');
    }
  };

  // Removed sample favorites fallback

  const removeFavoriteById = async (photoId: string) => {
    try {
      const favoritesJson = await AsyncStorage.getItem('favoritePhotos');
      const favoriteIds: string[] = favoritesJson ? JSON.parse(favoritesJson) : [];
      const updatedIds = favoriteIds.filter(id => id !== photoId);
      await AsyncStorage.setItem('favoritePhotos', JSON.stringify(updatedIds));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const removeFavorite = async (photo: Photo) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${photo.filename}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavoriteById(photo.id);
              // Update local state
              setFavoritePhotos(prev => prev.filter(p => p.id !== photo.id));
              
              Alert.alert(
                'Removed',
                'Photo removed from favorites.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove photo from favorites.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const renderPhoto = (photo: Photo, index: number) => (
    <TouchableOpacity
      key={photo.id}
      style={styles.photoCard}
      onPress={() => openPreview(photo)}
      onLongPress={() => removeFavorite(photo)}
    >
      { (localUris[photo.id] && !(localUris[photo.id]||'').startsWith('ph:')) ? (
        <Image source={{ uri: localUris[photo.id] }} style={styles.photoImage} />
      ) : (photo.uri && (photo.uri.startsWith('http') || photo.uri.startsWith('file:'))) ? (
        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
      ) : (
  <Image source={require('../assets/app_icon_photo_picks.png')} style={styles.photoImage} />
      )}
      <View style={styles.photoOverlay}>
        <Ionicons name="heart" size={20} color="#ff4757" />
      </View>
      <View style={styles.photoInfo}>
        <Text style={styles.photoTitle} numberOfLines={1}>
          {photo.filename || `Photo ${index + 1}`}
        </Text>
        <Text style={styles.photoDate}>
          {new Date(photo.creationTime).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="heart" size={48} color="#ff4757" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={["#0f1422", "#1a202c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.headerGradient} />
        <View style={styles.header}>
  <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="heart" size={24} color="#ff4757" />
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.countText}>{favoritePhotos.length}</Text>
        </View>
        </View>
      </View>
      {/* Tip bar under header */}
      <View style={styles.tipBar}>
  <Ionicons name="information-circle" size={14} color="#a78bfa" style={{ marginRight: 6 }} />
        <Text style={styles.tipText}>Tip: Tap and hold a photo to remove it.</Text>
      </View>

      {favoritePhotos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#6c757d" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start marking photos as favorites in Swipe Mode by tapping the heart icon
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={onStartSwiping} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.9}>
            <LinearGradient colors={["#4f46e5", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButtonBg}>
              <Text style={styles.startButtonText}>Start Swiping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.photosContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7c3aed"
              colors={['#7c3aed']}
            />
          }
        >
          <View style={styles.photosGrid}>
            {favoritePhotos.map((photo, index) => renderPhoto(photo, index))}
          </View>
        </ScrollView>
      )}
      {/* Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="slide" onRequestClose={closePreview}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalHeaderButton} onPress={closePreview} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#ffffff" />
              <Text style={styles.modalHeaderButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalHeaderButton, styles.modalShareButton]} onPress={handleSharePreview} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-social" size={20} color="#ffffff" />
              <Text style={styles.modalHeaderButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {!previewUri ? (
              <ActivityIndicator size="large" color="#7c3aed" />
            ) : (
              <Image source={{ uri: previewUri }} style={styles.modalImage} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  headerWrapper: { position: 'relative' },
  headerGradient: { ...StyleSheet.absoluteFillObject },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  paddingTop: 50,
  paddingHorizontal: 16,
  paddingBottom: 16,
    backgroundColor: '#1a202c',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  countText: {
    color: '#4dabf7',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6c757d',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  startButton: {
    marginTop: 24,
    borderRadius: 25,
  },
  startButtonBg: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  photosContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0f1422',
    borderBottomColor: '#1f2740',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tipText: {
    color: '#9aa5b1',
    fontSize: 12,
    flex: 1,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#1a202c',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: ITEM_WIDTH * 1.2,
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  photoInfo: {
    padding: 12,
  },
  photoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  photoDate: {
    color: '#6c757d',
    fontSize: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(10,14,26,0.98)',
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f1422',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f2740',
  },
  modalHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  modalShareButton: {
    backgroundColor: 'rgba(79,70,229,0.25)',
  },
  modalHeaderButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 6,
  },
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default FavoritesManager;
