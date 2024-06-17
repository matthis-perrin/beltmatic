import {RefObject, useCallback, useEffect} from 'react';

export function useClickOutside<T extends HTMLElement>(
  refs: RefObject<T> | RefObject<T>[],
  callback: (e: MouseEvent) => void
): void {
  const handleGlobalMouseClick = useCallback(
    (e: MouseEvent) => {
      const refsToCheck = new Set((Array.isArray(refs) ? refs : [refs]).map(ref => ref.current));
      let currentTarget = e.target as T | null;
      while (currentTarget && !refsToCheck.has(currentTarget)) {
        currentTarget = currentTarget.parentElement as T | null;
      }
      if (!currentTarget) {
        callback(e);
      }
    },
    [callback, refs]
  );

  useEffect(() => {
    window.addEventListener('click', handleGlobalMouseClick);
    return () => window.removeEventListener('click', handleGlobalMouseClick);
  }, [handleGlobalMouseClick]);
}
