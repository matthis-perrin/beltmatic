import {useEffect} from 'react';

export function useGlobalKeyPress(keys: string[], handler: (event: KeyboardEvent) => void): void {
  useEffect(() => {
    function handlerKeyDown(event: KeyboardEvent): void {
      if (keys.includes(event.key)) {
        handler(event);
      }
    }
    window.addEventListener('keydown', handlerKeyDown);
    return () => window.removeEventListener('keydown', handlerKeyDown);
  }, [handler, keys]);
}
