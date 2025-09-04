// Photo management utilities
export interface Photo {
  uri: string;
  filename?: string | null;
  id?: string;
}

export interface PhotoStats {
  total: number;
  kept: number;
  deleted: number;
  edited: number;
}

// Generate sample photos with more realistic filenames and variety
export const generateSamplePhotos = (count: number = 10): Photo[] => {
  const photoTypes = [
    'sunset_beach', 'city_skyline', 'mountain_view', 'forest_path', 'ocean_waves',
    'desert_dunes', 'rain_drops', 'autumn_leaves', 'night_stars', 'flower_garden',
    'coffee_shop', 'street_art', 'vintage_car', 'food_plate', 'concert_stage',
    'architecture', 'wildlife', 'reflection', 'clouds', 'garden_path'
  ];

  return Array.from({ length: count }, (_, index) => ({
    uri: `https://picsum.photos/400/600?random=${20 + index}`,
    filename: `${photoTypes[index % photoTypes.length]}_${String(index + 1).padStart(3, '0')}.jpg`,
    id: `photo_${index + 1}`,
  }));
};

// Photo action handlers
export const handlePhotoAction = (
  action: 'keep' | 'delete' | 'edit',
  photo: Photo,
  onAction?: (action: string, photo: Photo) => void
) => {
  console.log(`Action: ${action} on photo: ${photo.filename}`);
  
  if (onAction) {
    onAction(action, photo);
  }
  
  // In a real app, you would:
  // - Move kept photos to a "favorites" album
  // - Add deleted photos to a "recently deleted" folder
  // - Open edit photo in external app or built-in editor
  
  switch (action) {
    case 'keep':
      // Add to favorites or kept photos collection
      break;
    case 'delete':
      // Move to trash/recently deleted
      break;
    case 'edit':
      // Open in photo editor
      break;
  }
};

// Calculate photo organization statistics
export const calculateStats = (
  totalPhotos: number,
  currentIndex: number,
  keptCount: number,
  deletedCount: number
): PhotoStats => {
  return {
    total: totalPhotos,
    kept: keptCount,
    deleted: deletedCount,
    edited: 0, // Could track separately if needed
  };
};

// Format photo stats for display
export const formatStats = (stats: PhotoStats): string => {
  const remaining = stats.total - stats.kept - stats.deleted;
  return `${stats.kept} kept • ${stats.deleted} deleted • ${remaining} remaining`;
};

// Mock external photo editor integration
export const openPhotoEditor = (photo: Photo): Promise<boolean> => {
  return new Promise((resolve) => {
    // In a real app, this would:
    // 1. Use react-native-image-picker to edit
    // 2. Open Photos app with deep linking
    // 3. Use a built-in photo editor
    
    console.log(`Opening photo editor for: ${photo.filename}`);
    
    // Simulate async operation
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
};

export default {
  generateSamplePhotos,
  handlePhotoAction,
  calculateStats,
  formatStats,
  openPhotoEditor,
};
