import {useCallback, useEffect, useState} from 'react';

import {useStateRef} from '@shared-web/lib/use_state_ref';

export interface GeolocationInfo {
  latitude: number;
  longitude: number;
  locationAccuracy: number;
}

export type GeolocationStatus =
  | {type: 'pending'}
  | {type: 'success'; loc: GeolocationInfo}
  | {type: 'error'; err: string};

export function useGeoloc(): {
  geoloc: GeolocationStatus;
  refreshGeoloc: () => void;
  isRefreshingGeoloc: boolean;
} {
  const [geoloc, setGeoloc] = useState<GeolocationStatus>({type: 'pending'});
  const [isRefreshingGeoloc, setIsRefreshingGeoloc, isRefreshingGeolocRef] = useStateRef(true);

  // The geoloc logic
  const triggerGeoloc = useCallback(() => {
    setIsRefreshingGeoloc(true);
    navigator.geolocation.getCurrentPosition(
      ({coords}) => {
        const {latitude, longitude, accuracy} = coords;
        const loc = {latitude, longitude, locationAccuracy: accuracy};
        setGeoloc({type: 'success', loc});
        setIsRefreshingGeoloc(false);
      },
      err => {
        setGeoloc({type: 'error', err: err.message});
        setIsRefreshingGeoloc(false);
      },
      {enableHighAccuracy: true, maximumAge: 0}
    );
  }, [setIsRefreshingGeoloc]);

  // Trigger initial geoloc
  useEffect(() => triggerGeoloc(), [triggerGeoloc]);

  // Create callback to manualy trigger a geoloc refresh
  const refreshGeoloc = useCallback(() => {
    if (!isRefreshingGeolocRef.current) {
      triggerGeoloc();
    }
  }, [isRefreshingGeolocRef, triggerGeoloc]);

  return {geoloc, refreshGeoloc, isRefreshingGeoloc};
}
