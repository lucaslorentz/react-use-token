export type NonFunctionPropertyNames<T> = T extends string
  ? keyof T & 'length'
  : T extends any[]
  ? keyof T & (number | 'length')
  : {
      [K in keyof T]: T[K] extends Function ? never : K;
    }[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type IfAny<T, Y, N = T> = 0 extends 1 & T ? Y : N;
export type IfNever<T, Y, N = T> = [T] extends [never] ? Y : N;
export type IfUnknown<T, Y, N = T> = [unknown] extends [T] ? Y : N;

export type GetValue<T, P extends PropertyKey, F = never> = IfNever<
  T[P & keyof T],
  F
>;

export type Remap<T> = {
  [k in keyof T]: (k extends string
    ? IfNever<GetValue<T, 'access_string_index'>, unknown>
    : unknown) &
    (k extends number
      ? IfNever<GetValue<T, 5.094701938837875e307>, unknown>
      : unknown) &
    GetValue<T, k>;
};

export type Cast<S, T, N = never> = S extends T ? S : N;

export type UnionToIntersection<T> = IfNever<
  T,
  never,
  (T extends any
  ? (x: T) => any
  : never) extends (x: infer R) => any
    ? R
    : never
>;
