import { Dispatch, useLayoutEffect, useState } from 'react';
import {
  FeatureMetadata,
  NoFeature,
  PartialToken,
  Token,
  TokenExtension,
  useToken,
  useTokenExtension,
  _metadata,
} from '../token';
import { NonFunctionProperties } from '../utils/types';

const _getValue = Symbol('getValue');
const _subscribe = Symbol('subscribe');
const _setValue = Symbol('setValue');

export interface State<TReadState, TWriteState = TReadState>
  extends ReadState<TReadState>,
    WriteState<TWriteState> {
  [_metadata]?: FeatureMetadata<
    'state',
    State<TReadState, TWriteState>,
    ReadState<TReadState> & WriteState<TWriteState>,
    {
      [P in keyof NonFunctionProperties<NonNullable<TReadState>> &
        keyof NonNullable<TWriteState>]-?: State<
        | NonNullable<TReadState>[P]
        | (TReadState extends null | undefined ? undefined : never),
        NonNullable<TWriteState>[P]
      >;
    }
  >;
}

export interface ReadState<TState> {
  [_getValue](): TState;
  [_subscribe](listener: TokenValueListener<TState>): Disposer;
  [_metadata]?: FeatureMetadata<
    'readState',
    ReadState<TState>,
    NoFeature,
    {
      [P in keyof NonFunctionProperties<NonNullable<TState>>]-?: ReadState<
        | NonNullable<TState>[P]
        | (TState extends null | undefined ? undefined : never)
      >;
    }
  >;
}

export interface WriteState<TState> {
  [_setValue](newValue: TState): void;
  [_metadata]?: FeatureMetadata<
    'writeState',
    WriteState<TState>,
    NoFeature,
    {
      [P in keyof NonFunctionProperties<NonNullable<TState>>]-?: WriteState<
        NonNullable<TState>[P]
      >;
    }
  >;
}

export type TokenValueListener<TState> = (newValue: TState) => void;
export type Disposer = () => void;

export function addState<TState>(
  initialValue: TState
): TokenExtension<NoFeature, State<TState>> {
  let value: TState = initialValue;

  const subscriptions: TokenValueListener<TState>[] = [];

  return {
    extend: {
      [_getValue]: function() {
        return value!;
      },
      [_setValue]: function(newValue: TState) {
        value = newValue;
        for (var subscription of subscriptions.slice()) {
          subscription(newValue);
        }
      },
      [_subscribe]: function(callback: TokenValueListener<TState>) {
        subscriptions.push(callback);
        return () => {
          const index = subscriptions.indexOf(callback);
          if (index !== -1) subscriptions.splice(index, 1);
        };
      },
    },
    extendChildren: (_, parent, property) => ({
      [_getValue]: function() {
        var parentValue: any = parent[_getValue]();
        return parentValue?.[property];
      },
      [_setValue]: function(newValue: any) {
        const base = typeof property === 'number' ? [] : {};
        parent[_setValue](
          Object.assign(base, parent[_getValue](), { [property]: newValue })
        );
      },
      [_subscribe]: function(callback: TokenValueListener<TState>) {
        let snapshot = this[_getValue]();
        return parent[_subscribe]((newParentValue: any) => {
          const newValue = newParentValue?.[property];
          if (newValue !== snapshot) {
            snapshot = newValue;
            callback(newValue);
          }
        });
      },
    }),
  };
}

export function getTokenValue<TState>(token: PartialToken<ReadState<TState>>) {
  return token[_getValue]();
}

export function setTokenValue<TState>(
  token: PartialToken<WriteState<TState>>,
  newValue: TState
) {
  return token[_setValue](newValue);
}

export function subscribeToTokenValue<TState>(
  token: PartialToken<ReadState<TState>>,
  listener: TokenValueListener<TState>
): Disposer {
  return token[_subscribe](listener);
}

////////////////
// React API
////////////////
export function useStateToken<T>(initializer: T | (() => T)): Token<State<T>> {
  const token = useToken();
  const stateToken = useTokenExtension(token, () => {
    var initialValue: T =
      typeof initializer === 'function'
        ? (initializer as Function)()
        : initializer;
    return addState(initialValue);
  });
  return stateToken;
}

export function useTokenValue<TState>(token: PartialToken<ReadState<TState>>) {
  const [value, setValue] = useState<TState>(getTokenValue(token));
  useLayoutEffect(() => subscribeToTokenValue(token, setValue), [token]);
  return value;
}

export function useTokenSetter<T>(
  token: PartialToken<WriteState<T>>
): Dispatch<T> {
  return value => setTokenValue(token, value);
}

export function useTokenState<TReadState, TWriteState = TReadState>(
  token: PartialToken<ReadState<TReadState> & WriteState<TWriteState>>
): [TReadState, Dispatch<TWriteState>] {
  return [useTokenValue(token), useTokenSetter(token)];
}
