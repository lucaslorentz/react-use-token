export type NonFunctionPropertyNames<T> = T extends string
  ? keyof T & 'length'
  : T extends any[]
  ? keyof T & (number | 'length')
  : {
      [K in keyof T]: T[K] extends Function ? never : K;
    }[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
