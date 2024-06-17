import {useEffect, useState} from 'react';

interface InternalData<T> {
  val: T | undefined;
  v: number;
}
type InternalListener<T> = (dataStore: InternalData<T>) => void;

interface MapStoreApi<Key, Value> {
  getData: (key: Key) => Value | undefined;
  getAllData: () => Map<Key, Value>;
  setData: (key: Key, value: Value) => void;
  batchSetData: (batch: {key: Key; value: Value}[]) => void;
  useData: (key: Key) => Value | undefined;
  useAllData: () => Map<Key, Value>;
  unsetData: (key: Key) => void;
  batchUnsetData: (batch: Key[]) => void;
}

export function createMapStore<Key, Value>(): MapStoreApi<Key, Value> {
  const data = new Map<Key, InternalData<Value>>();
  let rawData: InternalData<Map<Key, Value>> = {val: new Map<Key, Value>(), v: 0};
  const listeners = new Map<Key, InternalListener<Value>[]>();
  const multiListeners = new Set<InternalListener<Map<Key, Value>>>();

  function getData(key: Key): Value | undefined {
    return data.get(key)?.val;
  }

  function getAllData(): Map<Key, Value> {
    return rawData.val ?? new Map();
  }

  function setData(key: Key, value: Value): void {
    batchSetData([{key, value}]);
  }

  function batchSetData(batch: {key: Key; value: Value}[]): void {
    const newRawDataVal = new Map(rawData.val === undefined ? [] : [...rawData.val.entries()]);
    for (const {key, value} of batch) {
      const listenersForKey = listeners.get(key);
      const valueForKey = data.get(key);
      const v = (valueForKey?.v ?? -1) + 1;
      const newValueForKey = {val: value, v};

      data.set(key, newValueForKey);
      newRawDataVal.set(key, value);

      for (const listener of listenersForKey ?? []) {
        listener(newValueForKey);
      }
    }

    rawData = {val: newRawDataVal, v: rawData.v + 1};
    for (const listener of multiListeners.values()) {
      listener(rawData);
    }
  }

  function unsetData(key: Key): void {
    batchUnsetData([key]);
  }

  function batchUnsetData(batch: Key[]): void {
    const newRawDataVal = new Map(rawData.val === undefined ? [] : [...rawData.val.entries()]);
    for (const key of batch) {
      const listenersForKey = listeners.get(key);
      const valueForKey = data.get(key);
      const v = (valueForKey?.v ?? -1) + 1;
      const newValueForKey = {val: undefined, v};

      data.set(key, newValueForKey);
      newRawDataVal.delete(key);

      for (const listener of listenersForKey ?? []) {
        listener(newValueForKey);
      }
    }

    rawData = {val: newRawDataVal, v: rawData.v + 1};
    for (const listener of multiListeners.values()) {
      listener(rawData);
    }
  }

  function useData(key: Key): Value | undefined {
    const currentData = data.get(key);
    const [internalData, setInternalData] = useState(currentData);
    useEffect(() => {
      // In case the rev of the data store changed between the time we did the `useState`
      // and the time of the `useEffect` we need to refresh manually the state.
      if (internalData !== currentData) {
        setInternalData(currentData);
      }
      // Register the state setter to be called for any subsequent data store change
      const listenersForKey = listeners.get(key);
      if (listenersForKey === undefined) {
        listeners.set(key, [setInternalData]);
      } else {
        listenersForKey.push(setInternalData);
      }
      return () => {
        const listenersForKey = listeners.get(key);
        if (listenersForKey === undefined) {
          return;
        }
        listenersForKey.splice(listenersForKey.indexOf(setInternalData), 1);
      };
    }, [key]); /* eslint-disable-line react-hooks/exhaustive-deps */
    return internalData?.val;
  }

  function useAllData(): Map<Key, Value> {
    const [internalData, setInternalData] = useState(rawData);
    useEffect(() => {
      // In case the rev of the data store changed between the time we did the `useState`
      // and the time of the `useEffect` we need to refresh manually the state.
      if (internalData !== rawData) {
        setInternalData(rawData);
      }
      // Register the state setter to be called for any subsequent data store change
      multiListeners.add(setInternalData);
      return () => {
        multiListeners.delete(setInternalData);
      };
    }, []); /* eslint-disable-line react-hooks/exhaustive-deps */
    return internalData.val ?? new Map();
  }

  return {
    getData,
    getAllData,
    setData,
    batchSetData,
    useData,
    useAllData,
    unsetData,
    batchUnsetData,
  };
}
