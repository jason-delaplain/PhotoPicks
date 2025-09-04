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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Photo {
  uri: string;
  filename?: string | null;
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
  
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const nextPhotoScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadSamplePhotos();
  }, []);

  const loadSamplePhotos = () => {
    // Enhanced sample photos with more variety
    const samplePhotos = [
      { uri: 'https://picsum.photos/400/600?random=20', filename: 'sunset_beach.jpg' },
      { uri: 'https://picsum.photos/400/600?random=21', filename: 'city_skyline.jpg' },
      { uri: 'https://picsum.photos/400/600?random=22', filename: 'mountain_view.jpg' },
      { uri: 'https://picsum.photos/400/600?random=23', filename: 'forest_path.jpg' },
      { uri: 'https://picsum.photos/400/600?random=24', filename: 'ocean_waves.jpg' },
      { uri: 'https://picsum.photos/400/600?random=25', filename: 'desert_dunes.jpg' },
      { uri: 'https://picsum.photos/400/600?random=26', filename: 'rain_drops.jpg' },
      { uri: 'https://picsum.photos/400/600?random=27', filename: 'autumn_leaves.jpg' },
      { uri: 'https://picsum.photos/400/600?random=28', filename: 'night_stars.jpg' },
      { uri: 'https://picsum.photos/400/600?random=29', filename: 'flower_garden.jpg' },
    ];
    
    setPhotos(samplePhotos);
    setLoading(false);
  };

  const handleSwipeAction = (direction: 'left' | 'right', fromButton = false) => {
    if (currentIndex >= photos.length) return;

    const currentPhoto = photos[currentIndex];
    const action = direction === 'left' ? 'delete' : 'keep';
    
    // Update counters
    if (action === 'delete') {
      setDeletedCount(prev => prev + 1);
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

  const handleEditPhoto = () => {
    if (currentIndex >= photos.length) return;
    
    const currentPhoto = photos[currentIndex];
    onPhotoAction('edit', currentPhoto);
    
    Alert.alert(
      'Edit Photo',
      `Would you like to open ${currentPhoto.filename || 'this photo'} in an external editor?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Photos App', 
          onPress: () => {
            // In a real app, you'd use a library like react-native-image-picker
            // For demo, we'll show an alert
            Alert.alert('Demo Mode', 'In a real app, this would open the Photos app or another image editor.');
          }
        },
      ]
    );
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
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
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
        
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
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
        <TouchableOpacity style={styles.backButtonSmall} onPress={onBack}>
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
