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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keptCount, setKeptCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [photosMarkedForDeletion, setPhotosMarkedForDeletion] = useState<Photo[]>([]); // Track photos marked for deletion
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const zoomScale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const nextPhotoScale = useRef(new Animated.Value(0.9)).current;
  
  // Track pinch gesture state
  const [isZooming, setIsZooming] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [currentZoomScale, setCurrentZoomScale] = useState(1);
  const [lastTap, setLastTap] = useState<number | null>(null);

  useEffect(() => {
    console.log('Loading device photos');
    loadDevicePhotos();
  }, []);

  // Debug: Log when photos state changes
  useEffect(() => {
    console.log(`Photos state changed: now ${photos.length} photos`);
  }, [photos]);

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
      const realPhotos = photosMarkedForDeletion.filter(photo => 
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
        console.log('Permission denied, loading sample photos');
        Alert.alert(
          'Permission Required',
          'We need access to your photos to organize them. Loading sample photos for demo.',
          [{ text: 'OK' }]
        );
        loadSamplePhotos();
        return;
      }

      // Get photos from device
      console.log('Getting assets from MediaLibrary...');
      const mediaResult = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 20, // Reduced for testing
        sortBy: 'creationTime'
      });

      console.log(`Found ${mediaResult.assets.length} assets from MediaLibrary`);

      if (mediaResult.assets.length === 0) {
        console.log('No device photos found, loading sample photos');
        Alert.alert(
          'No Photos Found',
          'No photos were found on your device. Loading sample photos for demo.',
          [{ text: 'OK' }]
        );
        loadSamplePhotos();
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

      console.log(`Total device photos loaded: ${devicePhotos.length}`);
      setPhotos(devicePhotos);
      console.log(`Photos state updated to ${devicePhotos.length} photos`);
      setLoading(false);
    } catch (error) {
      console.error('Error loading photos:', error);
      console.log('Loading sample photos due to error');
      // Always load sample photos if there's any error (including Expo Go limitations)
      Alert.alert(
        'Using Sample Photos',
        'Due to platform limitations in Expo Go, we\'ll use sample photos to demonstrate the app functionality.',
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
    console.log(`Handle swipe action: direction=${direction}, fromButton=${fromButton}, currentIndex=${currentIndex}, photosLength=${photos.length}`);
    
    if (currentIndex >= photos.length) {
      console.log('No more photos to swipe');
      return;
    }

    const currentPhoto = photos[currentIndex];
    console.log(`Current photo: ${currentPhoto.filename}, id: ${currentPhoto.id}`);
    
    const action = direction === 'left' ? 'delete' : 'keep';
    console.log(`Action: ${action}`);
    
    // Update counters
    if (action === 'delete') {
      setDeletedCount(prev => {
        console.log(`Updating deleted count from ${prev} to ${prev + 1}`);
        return prev + 1;
      });
      
      // Check if this is a sample photo
      const isSamplePhoto = currentPhoto.id && currentPhoto.id.startsWith('sample_');
      console.log(`Is sample photo: ${isSamplePhoto}`);
      
      if (isSamplePhoto) {
        // For sample photos, just show a message and continue
        console.log(`Sample photo marked for deletion: ${currentPhoto.filename}`);
        if (fromButton) {
          Alert.alert(
            'Sample Photo',
            'This is a sample photo and cannot be actually deleted from your device.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // For real photos, add to marked for deletion
        setPhotosMarkedForDeletion(prev => [...prev, currentPhoto]);
        console.log(`Photo marked for deletion: ${currentPhoto.filename}`);
      }
    } else {
      setKeptCount(prev => {
        console.log(`Updating kept count from ${prev} to ${prev + 1}`);
        return prev + 1;
      });
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
      scale.setValue(1);
      zoomScale.setValue(1);
      rotation.setValue(0);
      nextPhotoScale.setValue(0.9);
      setCurrentZoomScale(1);
    });
  };

  const handleEditPhoto = async () => {
    if (currentIndex >= photos.length) return;
    
    const currentPhoto = photos[currentIndex];
    onPhotoAction('edit', currentPhoto);
    
    try {
      // For sample photos, show info message
      if (currentPhoto.id && currentPhoto.id.startsWith('sample_')) {
        Alert.alert(
          'Sample Photo',
          'This is a sample photo. In a real app, you would be able to edit your actual photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (Platform.OS === 'ios') {
        // iOS: Go directly to share dialog
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(currentPhoto.uri, {
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
                    await Sharing.shareAsync(currentPhoto.uri, {
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
                    await Sharing.shareAsync(currentPhoto.uri, {
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

  // Utility functions for pinch gesture detection
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const [touch1, touch2] = touches;
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const [touch1, touch2] = touches;
    return {
      x: (touch1.pageX + touch2.pageX) / 2,
      y: (touch1.pageY + touch2.pageY) / 2,
    };
  };

  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(zoomScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentZoomScale(1);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      console.log('Double tap detected - resetting zoom');
      resetZoom();
      setLastTap(null);
    } else {
      setLastTap(now);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      // Always capture if multiple touches (pinch)
      return evt.nativeEvent.touches.length >= 1;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
      // If multiple touches, it's a pinch gesture
      if (touches.length >= 2) {
        return true;
      }
      
      // For single touch, only capture horizontal swipes (existing behavior)
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    
    onPanResponderGrant: (evt) => {
      const touches = evt.nativeEvent.touches;
      
      if (touches.length >= 2) {
        // Pinch gesture started
        setIsZooming(true);
        const distance = getDistance(touches);
        setInitialDistance(distance);
        setInitialScale(currentZoomScale);
        console.log('Pinch gesture started');
      } else {
        // Single finger gesture (swipe)
        setIsZooming(false);
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start();
      }
    },

    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
      if (touches.length >= 2 && isZooming) {
        // Handle pinch-to-zoom
        const distance = getDistance(touches);
        if (initialDistance > 0) {
          const scaleChange = distance / initialDistance;
          let newScale = initialScale * scaleChange;
          
          // Limit zoom between 0.5x and 3x
          newScale = Math.max(0.5, Math.min(3, newScale));
          
          zoomScale.setValue(newScale);
          setCurrentZoomScale(newScale);
          
          // If zoomed in, allow panning
          if (newScale > 1) {
            const center = getCenter(touches);
            // Simple panning - can be enhanced for better UX
            translateX.setValue(gestureState.dx * 0.5);
            translateY.setValue(gestureState.dy * 0.5);
          }
        }
      } else if (touches.length === 1 && !isZooming) {
        // Handle single finger swipe (existing behavior)
        translateX.setValue(gestureState.dx);
        rotation.setValue(gestureState.dx * 0.05);
        
        // Scale next photo based on current photo movement
        const progress = Math.abs(gestureState.dx) / SCREEN_WIDTH;
        nextPhotoScale.setValue(0.9 + (progress * 0.1));
      }
    },

    onPanResponderRelease: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
      if (isZooming) {
        // End pinch gesture
        setIsZooming(false);
        console.log('Pinch gesture ended');
        
        // If zoom is close to 1, snap back to 1
        if (Math.abs(currentZoomScale - 1) < 0.1) {
          resetZoom();
        }
      } else {
        // Handle single finger release (existing swipe behavior)
        console.log(`Pan responder release: dx=${gestureState.dx}, dy=${gestureState.dy}, SWIPE_THRESHOLD=${SWIPE_THRESHOLD}`);
        
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          const direction = gestureState.dx > 0 ? 'right' : 'left';
          console.log(`Swipe detected! Direction: ${direction}`);
          
          // Reset zoom before swiping to next photo
          resetZoom();
          handleSwipeAction(direction);
        } else {
          console.log('Swipe not strong enough, snapping back');
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
          <Text style={styles.editButtonText}>
            {Platform.select({ ios: 'Share', android: 'Share', default: 'Share' })}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>PhotoPicks - Swipe Mode</Text>
        <Text style={styles.subtitle}>Swipe left to delete • Swipe right to keep • Pinch to zoom</Text>
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
                { translateY },
                { scale: Animated.multiply(scale, zoomScale) },
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
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={handleDoubleTap}
            style={styles.imageContainer}
          >
            <Image source={{ uri: currentPhoto.uri }} style={styles.photo} />
          </TouchableOpacity>
          
          {/* Filename overlay */}
          <View style={styles.filenameOverlay}>
            <Text style={styles.filenameText}>{currentPhoto.filename}</Text>
          </View>
          
          {/* Swipe indicators - only show when not zooming */}
          {!isZooming && (
            <>
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
                <MaterialIcons name="delete" size={80} color="#ffffff" />
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
                <Ionicons name="heart" size={80} color="#ffffff" />
              </Animated.View>
            </>
          )}
        </Animated.View>
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
  imageContainer: {
    width: '100%',
    height: '100%',
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
