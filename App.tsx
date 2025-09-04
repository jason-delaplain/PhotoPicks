import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingSplash from './src/components/LoadingSplash';
import LandingPage from './src/components/LandingPage';
import SwipePhotoSwiper from './src/components/SwipePhotoSwiper';

type AppMode = 'loading' | 'landing' | 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'favorites' | 'similar';

export default function App() {
  const [mode, setMode] = useState<AppMode>('loading');
  const [pendingDeletions, setPendingDeletions] = useState<any[]>([]);

  // Load pending deletions from storage on app start
  useEffect(() => {
    loadPendingDeletions();
  }, []);

  const loadPendingDeletions = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingDeletions');
      if (stored) {
        const parsedDeletions = JSON.parse(stored);
        setPendingDeletions(parsedDeletions);
        console.log(`Loaded ${parsedDeletions.length} pending deletions from storage`);
      }
    } catch (error) {
      console.error('Error loading pending deletions:', error);
    }
  };

  const savePendingDeletions = async (deletions: any[]) => {
    try {
      await AsyncStorage.setItem('pendingDeletions', JSON.stringify(deletions));
      console.log(`Saved ${deletions.length} pending deletions to storage`);
    } catch (error) {
      console.error('Error saving pending deletions:', error);
    }
  };

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

  const handlePendingDeletions = async (photos: any[]) => {
    setPendingDeletions(photos);
    await savePendingDeletions(photos);
  };

  const handleConfirmDeletions = async () => {
    setPendingDeletions([]);
    await savePendingDeletions([]);
  };

  return (
    <View style={styles.container}>
      {mode === 'loading' && (
        <LoadingSplash onFinish={handleLoadingFinish} />
      )}
      {mode === 'landing' && (
        <LandingPage 
          onFeatureSelect={handleModeSelect}
          pendingDeletions={pendingDeletions}
          onConfirmDeletions={handleConfirmDeletions}
        />
      )}
      {mode === 'swipe' && (
        <SwipePhotoSwiper 
          onBack={handleBack} 
          onPendingDeletions={handlePendingDeletions}
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
