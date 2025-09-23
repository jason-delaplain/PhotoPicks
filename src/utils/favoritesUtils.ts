import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Photo {
  uri: string;
  filename?: string | null;
  id: string;
  mediaType?: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
}

const FAVORITES_STORAGE_KEY = 'favoritePhotos';

export const FavoritesUtils = {
  // Get all favorite photo IDs
  getFavoriteIds: async (): Promise<string[]> => {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error) {
      console.error('Error getting favorite IDs:', error);
      return [];
    }
  },

  // Check if a photo is favorited
  isFavorite: async (photoId: string): Promise<boolean> => {
    try {
      const favoriteIds = await FavoritesUtils.getFavoriteIds();
      return favoriteIds.includes(photoId);
    } catch (error) {
      console.error('Error checking if photo is favorite:', error);
      return false;
    }
  },

  // Add a photo to favorites
  addFavorite: async (photoId: string): Promise<boolean> => {
    try {
      const favoriteIds = await FavoritesUtils.getFavoriteIds();
      if (!favoriteIds.includes(photoId)) {
        favoriteIds.push(photoId);
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
        console.log(`Added photo ${photoId} to favorites`);
        return true;
      }
      return false; // Already a favorite
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  },

  // Remove a photo from favorites
  removeFavorite: async (photoId: string): Promise<boolean> => {
    try {
      const favoriteIds = await FavoritesUtils.getFavoriteIds();
      const updatedIds = favoriteIds.filter(id => id !== photoId);
      
      if (updatedIds.length !== favoriteIds.length) {
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedIds));
        console.log(`Removed photo ${photoId} from favorites`);
        return true;
      }
      return false; // Wasn't a favorite
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  },

  // Toggle favorite status
  toggleFavorite: async (photoId: string): Promise<boolean> => {
    const isCurrentlyFavorite = await FavoritesUtils.isFavorite(photoId);
    
    if (isCurrentlyFavorite) {
      await FavoritesUtils.removeFavorite(photoId);
      return false; // Now not a favorite
    } else {
      await FavoritesUtils.addFavorite(photoId);
      return true; // Now is a favorite
    }
  },

  // Get count of favorites
  getFavoritesCount: async (): Promise<number> => {
    try {
      const favoriteIds = await FavoritesUtils.getFavoriteIds();
      return favoriteIds.length;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  },

  // Clear all favorites
  clearAllFavorites: async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
      console.log('Cleared all favorites');
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }
};
