import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Initialize the state
  const [value, setValue] = useState(() => {
    const localStorageValue = window.localStorage.getItem(key);
    if (localStorageValue === null) {
      return initialValue;
    }
    try {
      return JSON.parse(localStorageValue);
    } catch {
      return initialValue;
    }
  });

  // Initialize the refs
  const rawValueRef = useRef<string | null>(null);
  const valueRef = useRef<T | null>(null);
  useEffect(() => {
    const localStorageValue = window.localStorage.getItem(key);
    if (localStorageValue === null) {
      rawValueRef.current = JSON.stringify(initialValue);
      valueRef.current = initialValue;
    } else {
      rawValueRef.current = localStorageValue;
      try {
        valueRef.current = JSON.parse(localStorageValue);
      } catch {
        valueRef.current = initialValue;
      }
    }
  }, [key, initialValue]);

  // Create the setter
  const setItem = (action: T | ((curr: T) => T)): void => {
    if (typeof action === 'function') {
      return setItem((action as (curr: T) => T)(valueRef.current ?? initialValue));
    }
    const newRawValue = JSON.stringify(action);
    rawValueRef.current = newRawValue;
    valueRef.current = action;
    setValue(action);
    window.localStorage.setItem(key, newRawValue);
  };

  // Handle storage changes
  const handleStorage = useCallback(
    (event: StorageEvent) => {
      if (event.key === key && event.newValue !== rawValueRef.current) {
        const parsed = event.newValue === null ? initialValue : JSON.parse(event.newValue);
        setValue(parsed);
        rawValueRef.current = event.newValue;
        valueRef.current = parsed;
      }
    },
    [initialValue, key]
  );
  useEffect(() => {
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [handleStorage]);

  // Return the state
  return [value, setItem];
}
