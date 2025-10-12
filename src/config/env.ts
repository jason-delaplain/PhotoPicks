/**
 * Environment configuration
 * Provides type-safe access to environment variables
 */

const ENV = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
  version: '1.0.0',
  
  // API configuration (if needed in future)
  apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
  
  // Feature flags
  features: {
    enableAnalytics: false,
    enableCrashReporting: false,
    enableBlurDetection: true,
    enableDuplicateDetection: false,
    enableColorSearch: false,
    enableSimilarSearch: false,
  },
  
  // App configuration
  config: {
    maxPhotosPerBatch: 100,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    blurThreshold: 0.5,
  },
} as const;

export default ENV;

/**
 * Type-safe feature flag checker
 */
export function isFeatureEnabled(feature: keyof typeof ENV.features): boolean {
  return ENV.features[feature];
}

/**
 * Get config value with type safety
 */
export function getConfig<K extends keyof typeof ENV.config>(
  key: K
): typeof ENV.config[K] {
  return ENV.config[key];
}
