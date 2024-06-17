export type Tuple1<T> = [T];
export type Tuple2<T> = [T, T];
export type Tuple3<T> = [T, T, T];
export type Tuple4<T> = [T, T, T, T];
export type Tuple5<T> = [T, T, T, T, T];
export type Tuple6<T> = [T, T, T, T, T, T];
export type Tuple7<T> = [T, T, T, T, T, T, T];
export type Tuple8<T> = [T, T, T, T, T, T, T, T];
export type Tuple12<T> = [T, T, T, T, T, T, T, T, T, T, T, T];
export type Tuple16<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];
export type TupleN<T> =
  | Tuple1<T>
  | Tuple2<T>
  | Tuple3<T>
  | Tuple4<T>
  | Tuple5<T>
  | Tuple6<T>
  | Tuple7<T>
  | Tuple8<T>
  | Tuple12<T>
  | Tuple16<T>;

// type MapTupleType<Tuple extends TupleN<unknown>, NewType> = {
//   [Index in keyof Tuple]: NewType;
// };

// type ExtractTupleType<T> = T extends TupleN<infer U> ? U : never;

export function tupleMap<S, T extends TupleN<S>, U>(
  tuple: T,
  fn: (val: S, i: number, tuple: S[]) => U
): TupleN<U> {
  return tuple.map(fn) as unknown as TupleN<U>;
}
