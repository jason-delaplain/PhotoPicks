import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import LoadingSplash from './src/components/LoadingSplash';
import LandingPage from './src/components/LandingPage';
import SwipePhotoSwiper from './src/components/SwipePhotoSwiper';
import FavoritesManager from './src/components/FavoritesManager';
import BlurryPhotos from './src/components/BlurryPhotos';
import { MediaLibraryDebug } from './src/components/MediaLibraryDebug';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type AppMode = 'loading' | 'landing' | 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'favorites' | 'similar' | 'debug';

export default function App() {
  const [mode, setMode] = useState<AppMode>('loading');

  const handleModeSelect = (selectedMode: 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'favorites' | 'similar' | 'debug') => {
    if (selectedMode === 'swipe') {
      console.log('Starting Swipe mode');
      setMode('swipe');
    } else if (selectedMode === 'blurry') {
      console.log('Starting Blurry mode');
      setMode('blurry');
    } else if (selectedMode === 'favorites') {
      console.log('Starting Favorites mode');
      setMode('favorites');
    } else if (selectedMode === 'debug') {
      console.log('Starting Debug mode');
      setMode('debug' as any);
    } else {
      // For now, all other AI features will show a "coming soon" message
      alert(`${selectedMode} feature coming soon!`);
      // You can set the mode to the specific feature for future implementation
      // setMode(selectedMode);
    }
  };

  const handleBack = () => {
    setMode('landing');
  };

  const handleLoadingFinish = () => {
    setMode('landing');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container}>
      {mode === 'loading' && (
        <LoadingSplash onFinish={handleLoadingFinish} />
      )}
      {mode === 'landing' && (
        <LandingPage 
          onFeatureSelect={handleModeSelect}
        />
      )}
      {mode === 'swipe' && (
        <SwipePhotoSwiper 
          onBack={handleBack} 
          onPhotoAction={(action: 'keep' | 'delete' | 'edit', photo: {
            uri: string; 
            filename?: string | null;
            id: string;
            mediaType?: string;
            width: number;
            height: number;
            creationTime: number;
            modificationTime: number;
          }) => {
            console.log(`Photo ${action}:`, photo.filename || photo.id);
            if (action === 'delete') {
              console.log('Photo deleted from device');
            } else if (action === 'edit') {
              console.log('Photo opened for editing');
            } else {
              console.log('Photo kept');
            }
          }}
        />
      )}
      {mode === 'blurry' && (
        <BlurryPhotos onBack={handleBack} />
      )}
      {mode === 'favorites' && (
        <FavoritesManager 
          onBack={handleBack}
        />
      )}
      <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a', // Match the new theme
  },
});
