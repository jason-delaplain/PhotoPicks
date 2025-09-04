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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  onPendingDeletions?: (photos: Photo[]) => void; // New prop to pass pending deletions back
}

const SwipePhotoSwiper: React.FC<SwipePhotoSwiperProps> = ({ onPhotoAction, onBack, onPendingDeletions }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keptCount, setKeptCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [pendingDeletions, setPendingDeletions] = useState<Photo[]>([]); // Track photos marked for deletion
  
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const nextPhotoScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadDevicePhotos();
    loadExistingPendingDeletions();
  }, []);

  const loadExistingPendingDeletions = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingDeletions');
      if (stored) {
        const parsedDeletions = JSON.parse(stored);
        setPendingDeletions(parsedDeletions);
        console.log(`Loaded ${parsedDeletions.length} existing pending deletions`);
      }
    } catch (error) {
      console.error('Error loading existing pending deletions:', error);
    }
  };

  const savePendingDeletionsToStorage = async (deletions: Photo[]) => {
    try {
      await AsyncStorage.setItem('pendingDeletions', JSON.stringify(deletions));
      console.log(`Saved ${deletions.length} pending deletions to storage`);
    } catch (error) {
      console.error('Error saving pending deletions to storage:', error);
    }
  };

  const handleBackPress = () => {
    if (pendingDeletions.length > 0) {
      Alert.alert(
        'Confirm Deletions',
        `You have ${pendingDeletions.length} photo${pendingDeletions.length > 1 ? 's' : ''} marked for deletion. What would you like to do?`,
        [
          { 
            text: 'Delete Now', 
            style: 'destructive',
            onPress: () => confirmDeletions()
          },
          { 
            text: 'Later', 
            onPress: async () => {
              // Save to storage and pass pending deletions back to parent
              await savePendingDeletionsToStorage(pendingDeletions);
              onPendingDeletions?.(pendingDeletions);
              onBack();
            }
          },
          { 
            text: 'Cancel', 
            style: 'cancel' 
          }
        ]
      );
    } else {
      onBack();
    }
  };

  const confirmDeletions = async () => {
    try {
      const realPhotos = pendingDeletions.filter(photo => 
        photo.id && !photo.id.startsWith('sample_')
      );
      
      if (realPhotos.length > 0) {
        await MediaLibrary.deleteAssetsAsync(realPhotos.map(photo => photo.id));
        console.log(`Deleted ${realPhotos.length} photos`);
      }
      
      Alert.alert(
        'Success',
        `${realPhotos.length} photo${realPhotos.length > 1 ? 's' : ''} deleted successfully.`,
        [{ text: 'OK', onPress: () => {
          // Clear pending deletions and storage, then go back
          setPendingDeletions([]);
          AsyncStorage.removeItem('pendingDeletions');
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
      // Request permissions - only for images
      const { status } = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to organize them. Please grant permission in Settings.',
          [
            { text: 'Cancel', onPress: () => onBack() },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Get photos from device
      const mediaResult = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 50, // Load first 50 photos for better performance
        sortBy: 'creationTime'
      });

      if (mediaResult.assets.length === 0) {
        Alert.alert(
          'No Photos Found',
          'No photos were found on your device.',
          [{ text: 'OK', onPress: () => onBack() }]
        );
        return;
      }

      // Convert MediaLibrary assets to our Photo interface with proper URIs
      const devicePhotos: Photo[] = await Promise.all(
        mediaResult.assets.map(async (asset) => {
          try {
            // Get asset info to ensure we have a proper URI
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
            return {
              uri: assetInfo.localUri || assetInfo.uri,
              filename: asset.filename,
              id: asset.id,
              mediaType: asset.mediaType,
              width: asset.width,
              height: asset.height,
              creationTime: asset.creationTime,
              modificationTime: asset.modificationTime
            };
          } catch (error) {
            console.warn('Error getting asset info for', asset.filename, error);
            // Fallback to original asset
            return {
              uri: asset.uri,
              filename: asset.filename,
              id: asset.id,
              mediaType: asset.mediaType,
              width: asset.width,
              height: asset.height,
              creationTime: asset.creationTime,
              modificationTime: asset.modificationTime
            };
          }
        })
      );

      setPhotos(devicePhotos);
      setLoading(false);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert(
        'Error',
        'Failed to load photos from your device. Using sample photos instead.',
        [{ text: 'OK' }]
      );
      loadSamplePhotos();
    }
  };

  const loadSamplePhotos = () => {
    // Fallback sample photos with required properties
    const samplePhotos: Photo[] = [
      { 
        uri: 'https://picsum.photos/400/600?random=20', 
        filename: 'sunset_beach.jpg',
        id: 'sample_1',
        width: 400,
        height: 600,
        creationTime: Date.now() - 86400000,
        modificationTime: Date.now() - 86400000
      },
      { 
        uri: 'https://picsum.photos/400/600?random=21', 
        filename: 'city_skyline.jpg',
        id: 'sample_2',
        width: 400,
        height: 600,
        creationTime: Date.now() - 172800000,
        modificationTime: Date.now() - 172800000
      },
      { 
        uri: 'https://picsum.photos/400/600?random=22', 
        filename: 'mountain_view.jpg',
        id: 'sample_3',
        width: 400,
        height: 600,
        creationTime: Date.now() - 259200000,
        modificationTime: Date.now() - 259200000
      },
    ];

    setPhotos(samplePhotos);
    setLoading(false);
  };

  const handleSwipeAction = async (direction: 'left' | 'right', fromButton = false) => {
    if (currentIndex >= photos.length) return;

    const currentPhoto = photos[currentIndex];
    const action = direction === 'left' ? 'delete' : 'keep';
    
    // Update counters
    if (action === 'delete') {
      setDeletedCount(prev => prev + 1);
      
      // For swipe actions, add to pending deletions
      if (!fromButton) {
        const newPendingDeletions = [...pendingDeletions, currentPhoto];
        setPendingDeletions(newPendingDeletions);
        savePendingDeletionsToStorage(newPendingDeletions);
        console.log(`Marked for deletion (swipe): ${currentPhoto.filename}`);
      }
      
      // For button presses, show confirmation and actually delete
      if (fromButton && currentPhoto.id && !currentPhoto.id.startsWith('sample_')) {
        try {
          const shouldDelete = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Delete Photo',
              `Are you sure you want to permanently delete "${currentPhoto.filename}"?`,
              [
                { text: 'Cancel', onPress: () => resolve(false) },
                { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
              ]
            );
          });

          if (shouldDelete) {
            await MediaLibrary.deleteAssetsAsync([currentPhoto.id]);
            console.log(`Deleted photo: ${currentPhoto.filename}`);
          } else {
            // User cancelled, don't count as deleted
            setDeletedCount(prev => prev - 1);
            return;
          }
        } catch (error) {
          console.error('Error deleting photo:', error);
          Alert.alert('Error', 'Failed to delete photo from device.');
          setDeletedCount(prev => prev - 1);
          return;
        }
      }
    } else {
      setKeptCount(prev => prev + 1);
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
      scale.setValue(1);
      rotation.setValue(0);
      nextPhotoScale.setValue(0.9);
    });
  };

  const handleEditPhoto = async () => {
    if (currentIndex >= photos.length) return;
    
    const currentPhoto = photos[currentIndex];
    onPhotoAction('edit', currentPhoto);
    
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // For real device photos, share directly
        if (currentPhoto.id && !currentPhoto.id.startsWith('sample_')) {
          await Sharing.shareAsync(currentPhoto.uri, {
            dialogTitle: `Edit ${currentPhoto.filename || 'Photo'}`,
            mimeType: 'image/jpeg',
          });
        } else {
          // For sample photos, we need to download and share
          Alert.alert(
            'Sample Photo',
            'This is a sample photo. In a real app, you would be able to edit your actual photos.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Fallback for platforms where sharing isn't available
        Alert.alert(
          'Edit Photo',
          Platform.select({
            ios: 'Would you like to open this photo in the Photos app?',
            android: 'Would you like to open this photo in your gallery app?',
            default: 'Photo editing is not available on this platform.'
          }),
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: Platform.select({ ios: 'Open Photos', android: 'Open Gallery', default: 'OK' }), 
              onPress: () => {
                // On iOS/Android, this would typically open the native photo app
                Linking.openURL(currentPhoto.uri).catch(() => {
                  Alert.alert('Error', 'Unable to open photo in external app.');
                });
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error sharing photo:', error);
      Alert.alert('Error', 'Failed to open photo for editing.');
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    
    onPanResponderGrant: () => {
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    },

    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
      rotation.setValue(gestureState.dx * 0.05);
      
      // Scale next photo based on current photo movement
      const progress = Math.abs(gestureState.dx) / SCREEN_WIDTH;
      nextPhotoScale.setValue(0.9 + (progress * 0.1));
    },

    onPanResponderRelease: (_, gestureState) => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
        const direction = gestureState.dx > 0 ? 'right' : 'left';
        handleSwipeAction(direction);
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(rotation, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(nextPhotoScale, {
            toValue: 0.9,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  if (photos.length === 0) {
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
    <View style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonSmall} onPress={handleBackPress}>
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
        <TouchableOpacity style={styles.editButton} onPress={handleEditPhoto}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>PhotoPicks - Swipe Mode</Text>
        <Text style={styles.subtitle}>Swipe or tap to organize photos</Text>
      </View>

      {/* Photo Stack Container */}
      <View style={styles.photoContainer}>
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
            <Image source={{ uri: nextPhoto.uri }} style={styles.photo} />
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
                { scale },
                { rotate: rotation.interpolate({
                    inputRange: [-200, 0, 200],
                    outputRange: ['-15deg', '0deg', '15deg'],
                  })
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image source={{ uri: currentPhoto.uri }} style={styles.photo} />
          
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
            <Text style={styles.indicatorText}>DELETE</Text>
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
            <Text style={styles.indicatorText}>KEEP</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleSwipeAction('left', true)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
          <Ionicons name="trash" size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.keepButton]} 
          onPress={() => handleSwipeAction('right', true)}
        >
          <Text style={styles.actionButtonText}>Keep</Text>
          <Ionicons name="heart" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
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
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerCenter: {
    alignItems: 'center',
  },
  backButtonSmall: {
    padding: 8,
    minWidth: 60,
  },
  backButtonSmallText: {
    color: '#74c0fc',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#4263eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
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
    color: '#74c0fc',
    fontSize: 14,
    marginTop: 5,
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  photoWrapper: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4263eb',
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
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    top: 40,
    left: 40,
    backgroundColor: 'rgba(255, 71, 87, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    transform: [{ rotate: '-25deg' }],
  },
  keepIndicator: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: 'rgba(46, 213, 115, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    transform: [{ rotate: '25deg' }],
  },
  indicatorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 30,
    paddingBottom: 50,
    gap: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    minHeight: 75,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4757',
  },
  keepButton: {
    backgroundColor: '#2ed573',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  backButton: {
    backgroundColor: '#4263eb',
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
