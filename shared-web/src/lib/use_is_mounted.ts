import {RefObject, useEffect, useRef} from 'react';

export const useIsMounted = (): RefObject<boolean> => {
  const ref = useRef(false);

  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, []);

  return ref;
};
