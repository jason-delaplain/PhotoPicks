// Favorites feature removed. This stub prevents import errors if referenced accidentally.
import React from 'react';
import { View, Text } from 'react-native';

const FavoritesManager: React.FC<{ onBack?: () => void; onStartSwiping?: () => void }> = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0e1a' }}>
      <Text style={{ color: '#fff' }}>Favorites feature is currently unavailable.</Text>
    </View>
  );
};

export default FavoritesManager;
