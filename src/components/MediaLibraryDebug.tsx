// Debug utility for testing MediaLibrary
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

interface DebugInfo {
  permissionStatus: string;
  assetCount: number;
  firstFewAssets: any[];
  error?: string;
}

export const MediaLibraryDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log('Starting MediaLibrary debug...');
      
      // Check permissions
      const permission = await MediaLibrary.getPermissionsAsync();
      console.log('Current permissions:', permission);
      
      let permissionStatus = `granted: ${permission.granted}, canAskAgain: ${permission.canAskAgain}`;
      
      if (!permission.granted) {
        console.log('Requesting permissions...');
        const newPermission = await MediaLibrary.requestPermissionsAsync();
        console.log('New permissions:', newPermission);
        permissionStatus = `After request - granted: ${newPermission.granted}`;
        
        if (!newPermission.granted) {
          setDebugInfo({
            permissionStatus,
            assetCount: 0,
            firstFewAssets: [],
            error: 'Permission denied'
          });
          setLoading(false);
          return;
        }
      }
      
      // Get assets
      console.log('Getting assets...');
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 5,
        sortBy: 'creationTime'
      });
      
      console.log(`Found ${result.assets.length} assets`);
      console.log('Assets:', result.assets);
      
      // Get detailed info for first few assets
      const detailedAssets: any[] = [];
      for (const asset of result.assets.slice(0, 3)) {
        try {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
          detailedAssets.push({
            id: asset.id,
            filename: asset.filename,
            uri: asset.uri,
            localUri: assetInfo.localUri,
            mediaType: asset.mediaType,
            width: asset.width,
            height: asset.height
          });
        } catch (error) {
          console.log('Error getting asset info:', error);
          detailedAssets.push({
            id: asset.id,
            filename: asset.filename,
            uri: asset.uri,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      setDebugInfo({
        permissionStatus,
        assetCount: result.assets.length,
        firstFewAssets: detailedAssets
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({
        permissionStatus: 'error',
        assetCount: 0,
        firstFewAssets: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>MediaLibrary Debug</Text>
      
      <Button 
        title={loading ? "Running..." : "Run Debug Test"}
        onPress={runDebug}
        disabled={loading}
      />
      
      {debugInfo && (
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>Results:</Text>
          <Text>Permission Status: {debugInfo.permissionStatus}</Text>
          <Text>Asset Count: {debugInfo.assetCount}</Text>
          
          {debugInfo.error && (
            <Text style={styles.error}>Error: {debugInfo.error}</Text>
          )}
          
          <Text style={styles.sectionTitle}>First Few Assets:</Text>
          {debugInfo.firstFewAssets.map((asset, index) => (
            <View key={index} style={styles.assetInfo}>
              <Text>Asset {index + 1}:</Text>
              <Text>  ID: {asset.id}</Text>
              <Text>  Filename: {asset.filename}</Text>
              <Text>  URI: {asset.uri?.substring(0, 50)}...</Text>
              <Text>  LocalURI: {asset.localUri?.substring(0, 50) || 'null'}...</Text>
              {asset.error && <Text style={styles.error}>  Error: {asset.error}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  results: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  assetInfo: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
  },
});
