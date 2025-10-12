/**
 * Global type definitions for PhotoPicks
 * 
 * This file contains shared types used throughout the application.
 * Import these types where needed for better type safety.
 */

import { Asset } from 'expo-media-library';

/**
 * Photo object interface
 * Used throughout the app for photo data
 */
export interface Photo {
  id: string;
  uri: string;
  filename?: string | null;
  mediaType?: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
}

/**
 * Cached photo interface
 * Used by the media cache system
 */
export interface CachedPhoto extends Photo {
  // Extends Photo with any additional cache-specific properties
}

/**
 * Photo action types
 */
export type PhotoAction = 'keep' | 'delete' | 'edit';

/**
 * Photo statistics
 */
export interface PhotoStats {
  total: number;
  kept: number;
  deleted: number;
  edited: number;
}

/**
 * App mode types
 */
export type AppMode = 'loading' | 'landing' | 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'similar';

/**
 * Media library permission status
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Progress callback for long-running operations
 */
export interface Progress {
  done: number;
  total: number;
}

/**
 * Blur detection result
 */
export interface BlurDetectionResult {
  isBlurry: boolean;
  score: number;
  photo: Photo;
}

/**
 * Component props interfaces
 */

export interface LandingPageProps {
  onFeatureSelect: (mode: 'swipe' | 'blurry' | 'duplicates' | 'keyword' | 'color' | 'similar') => void;
}

export interface LoadingSplashProps {
  onFinish: () => void;
}

export interface SwipePhotoSwiperProps {
  onBack: () => void;
  onPhotoAction: (action: PhotoAction, photo: Photo) => void;
}

export interface BlurryPhotosProps {
  onBack: () => void;
}

/**
 * Utility type helpers
 */

/**
 * Make specific properties required
 */
export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Media library types
 */
export type MediaLibraryAsset = Asset;

export interface MediaLibraryOptions {
  first?: number;
  after?: string;
  mediaType?: 'photo' | 'video' | 'audio' | 'unknown';
  sortBy?: 'default' | 'creationTime' | 'modificationTime' | 'mediaType' | 'width' | 'height' | 'duration';
}

/**
 * Error types
 */
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class MediaLibraryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaLibraryError';
  }
}

/**
 * API Response types
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: AppError;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Async operation states
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: LoadingState;
  data: T | null;
  error: Error | null;
}

/**
 * Environment types
 */
export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  apiUrl?: string;
  version: string;
}

/**
 * Type guards
 */

export function isPhoto(obj: unknown): obj is Photo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'uri' in obj &&
    'width' in obj &&
    'height' in obj
  );
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse<T>(response: ApiResponse<T>): response is ErrorResponse {
  return response.success === false;
}

/**
 * Utility types for React
 */
export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export type ReactChildren = React.ReactNode | React.ReactNode[];

/**
 * Animation types
 */
export interface AnimationConfig {
  duration: number;
  delay?: number;
  useNativeDriver?: boolean;
}

/**
 * Gesture types
 */
export interface GestureState {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
}

export interface SwipeGesture extends GestureState {
  direction: 'left' | 'right' | 'up' | 'down';
  velocity: number;
}
