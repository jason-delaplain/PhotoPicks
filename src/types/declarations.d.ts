/**
 * Custom type declarations for modules without official types
 * or to extend existing type definitions
 */

/// <reference types="react" />
/// <reference types="react-native" />

declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpeg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.gif' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.json' {
  const value: any;
  export default value;
}

/**
 * Extend window object for web platform
 */
declare global {
  interface Window {
    __DEV__?: boolean;
  }
}

/**
 * Process env types for environment variables
 */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    EXPO_PUBLIC_API_URL?: string;
  }
}

export {};
