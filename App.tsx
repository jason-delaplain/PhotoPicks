import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import LoadingSplash from './src/components/LoadingSplash';
import LandingPage from './src/components/LandingPage';
import SwipePhotoSwiper from './src/components/SwipePhotoSwiper';

type AppMode = 'loading' | 'landing' | 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'favorites' | 'similar';

export default function App() {
  const [mode, setMode] = useState<AppMode>('loading');

  const handleModeSelect = (selectedMode: 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'favorites' | 'similar') => {
    if (selectedMode === 'swipe') {
      setMode('swipe');
    } else {
      // For now, all AI features will show a "coming soon" message
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
    <View style={styles.container}>
      {mode === 'loading' && (
        <LoadingSplash onFinish={handleLoadingFinish} />
      )}
      {mode === 'landing' && (
        <LandingPage onFeatureSelect={handleModeSelect} />
      )}
      {mode === 'swipe' && (
        <SwipePhotoSwiper 
          onBack={handleBack} 
          onPhotoAction={(action: 'keep' | 'delete' | 'edit', photo: {uri: string; filename?: string | null}) => {
            console.log(`Photo ${action}:`, photo.filename);
          }}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a', // Match the new theme
  },
});
