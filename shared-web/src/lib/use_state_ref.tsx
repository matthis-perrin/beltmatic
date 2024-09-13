import {Dispatch, SetStateAction, useCallback, useRef, useState} from 'react';

function isFunction<S>(setStateAction: SetStateAction<S>): setStateAction is (prevState: S) => S {
  return typeof setStateAction === 'function';
}

interface ReadOnlyRefObject<T> {
  readonly current: T;
}
type UseStateRef<T> = [T, Dispatch<SetStateAction<T>>, ReadOnlyRefObject<T>];
type ExtractState<T> = T extends () => infer U ? U : T;

export function useStateRef<State>(): UseStateRef<State | undefined>;
export function useStateRef<Initial>(initialState: Initial): UseStateRef<ExtractState<Initial>>;
export function useStateRef<Initial>(initialState?: Initial): UseStateRef<ExtractState<Initial>> {
  const [state, setState] = useState<ExtractState<Initial>>(initialState as ExtractState<Initial>);
  const ref = useRef(state);

  const dispatch = useCallback((setStateAction: SetStateAction<ExtractState<Initial>>) => {
    ref.current = isFunction(setStateAction) ? setStateAction(ref.current) : setStateAction;
    setState(ref.current);
  }, []);

  return [state, dispatch, ref];
}
