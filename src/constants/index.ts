/**
 * App-wide constants
 * Centralized location for magic numbers and configuration values
 */

export const COLORS = {
  // Primary theme colors
  primary: '#6d28d9',
  primaryDark: '#5b21b6',
  primaryLight: '#8b5cf6',
  
  // Background colors
  background: '#0a0e1a',
  backgroundLight: '#1a1f2e',
  backgroundDark: '#050710',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  
  // Accent colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // UI colors
  border: '#374151',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(109, 40, 217, 0.3)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const ANIMATION = {
  // Duration in milliseconds
  fast: 200,
  normal: 300,
  slow: 500,
  
  // Easing
  easeIn: 'ease-in' as const,
  easeOut: 'ease-out' as const,
  easeInOut: 'ease-in-out' as const,
  linear: 'linear' as const,
} as const;

export const LAYOUT = {
  // Maximum content width
  maxWidth: 1200,
  
  // Header height
  headerHeight: 60,
  
  // Tab bar height
  tabBarHeight: 60,
  
  // Safe area padding
  safeAreaPadding: 20,
} as const;

export const PHOTO = {
  // Thumbnail size
  thumbnailSize: 200,
  
  // Maximum photo size for processing
  maxProcessingSize: 2048,
  
  // Batch size for loading photos
  batchSize: 50,
  
  // Blur detection threshold
  blurThreshold: 0.5,
  
  // Image quality for thumbnails (0-1)
  thumbnailQuality: 0.7,
} as const;

export const GESTURES = {
  // Swipe threshold (pixels)
  swipeThreshold: 100,
  
  // Velocity threshold (pixels/second)
  velocityThreshold: 500,
  
  // Minimum drag distance to register
  minDragDistance: 10,
} as const;

export const STORAGE_KEYS = {
  favorites: '@photopicks/favorites',
  settings: '@photopicks/settings',
  cache: '@photopicks/cache',
} as const;

export const API = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

export const MESSAGES = {
  permissions: {
    mediaLibrary: 'PhotoPicks needs access to your photo library to help you organize your photos.',
    cameraRoll: 'Allow PhotoPicks to access your camera roll to view and organize photos.',
  },
  errors: {
    permissionDenied: 'Permission denied. Please enable photo library access in Settings.',
    loadFailed: 'Failed to load photos. Please try again.',
    deleteFailed: 'Failed to delete photo. Please try again.',
    noPhotos: 'No photos found in your library.',
  },
  success: {
    photoDeleted: 'Photo deleted successfully',
    photoKept: 'Photo kept',
    refreshComplete: 'Photo library refreshed',
  },
} as const;

/**
 * Type helpers for constants
 */
export type Color = typeof COLORS[keyof typeof COLORS];
export type Spacing = typeof SPACING[keyof typeof SPACING];
export type FontSize = typeof FONT_SIZES[keyof typeof FONT_SIZES];
export type BorderRadius = typeof BORDER_RADIUS[keyof typeof BORDER_RADIUS];
