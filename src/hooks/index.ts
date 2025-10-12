/**
 * Custom React hooks for PhotoPicks
 * Reusable logic extracted into hooks for better code organization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';
import type { Photo, Progress, LoadingState } from '../types';

/**
 * Hook for managing media library permissions
 */
export function useMediaLibraryPermissions() {
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  return {
    permissionStatus,
    isLoading,
    hasPermission: permissionStatus === 'granted',
    requestPermissions,
    checkPermissions,
  };
}

/**
 * Hook for managing async operations with loading state
 */
export function useAsync<T>() {
  const [status, setStatus] = useState<LoadingState>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setStatus('loading');
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
      setStatus('success');
      return result;
    } catch (err) {
      setError(err as Error);
      setStatus('error');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return {
    status,
    data,
    error,
    execute,
    reset,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',
  };
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for tracking component mount state
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

/**
 * Hook for previous value tracking
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for interval-based updates
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for managing toggle state
 */
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  return [value, toggle, setValue];
}

/**
 * Hook for managing array state
 */
export function useArray<T>(initialValue: T[] = []) {
  const [array, setArray] = useState(initialValue);

  const push = useCallback((element: T) => {
    setArray(a => [...a, element]);
  }, []);

  const filter = useCallback((callback: (item: T) => boolean) => {
    setArray(a => a.filter(callback));
  }, []);

  const update = useCallback((index: number, newElement: T) => {
    setArray(a => {
      const copy = [...a];
      copy[index] = newElement;
      return copy;
    });
  }, []);

  const remove = useCallback((index: number) => {
    setArray(a => a.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  return {
    array,
    set: setArray,
    push,
    filter,
    update,
    remove,
    clear,
  };
}

/**
 * Hook for safe state updates (prevents updates on unmounted components)
 */
export function useSafeState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);
  const isMounted = useIsMounted();

  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMounted()) {
      setState(value);
    }
  }, [isMounted]);

  return [state, setSafeState];
}

export default {
  useMediaLibraryPermissions,
  useAsync,
  useDebounce,
  useIsMounted,
  usePrevious,
  useInterval,
  useToggle,
  useArray,
  useSafeState,
};
