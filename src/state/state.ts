import { Dispatch, useEffect, useState } from 'react';
import {
  DeclareChildFeatures,
  NoFeature,
  Token,
  TokenExtension,
  useToken,
  useTokenExtension,
  _childFeatures,
} from '../token';

const _getValue = Symbol('getValue');
const _subscribe = Symbol('subscribe');
const _setValue = Symbol('setValue');

export interface State<TReadState, TWriteState = TReadState>
  extends ReadState<TReadState>,
    WriteState<TWriteState> {
  [_childFeatures]?: DeclareChildFeatures<
    ReadState<TReadState> & WriteState<TWriteState>,
    'state',
    {
      [P in keyof NonNullable<TReadState> &
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
  [_childFeatures]?: DeclareChildFeatures<
    NoFeature,
    'readState',
    {
      [P in keyof NonNullable<TState>]-?: ReadState<
        | NonNullable<TState>[P]
        | (TState extends null | undefined ? undefined : never)
      >;
    }
  >;
}

export interface WriteState<TState> {
  [_setValue](newValue: TState): void;
  [_childFeatures]?: DeclareChildFeatures<
    NoFeature,
    'writeState',
    {
      [P in keyof NonNullable<TState>]-?: WriteState<NonNullable<TState>[P]>;
    }
  >;
}

export type TokenValueListener<TState> = (newValue: TState) => void;
export type Disposer = () => void;

export function addState<TState>(
  initializer: TState | (() => TState)
): TokenExtension<NoFeature, State<TState>> {
  var initialized = false;

  let value: TState | undefined;

  if (typeof initializer !== 'function') {
    value = initializer;
    initialized = true;
  }

  const subscriptions: TokenValueListener<TState>[] = [];

  return {
    extend: {
      [_getValue]: function() {
        if (!initialized) {
          initialized = true;
          value = (initializer as () => TState)();
        }
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

export function getTokenValue<TState>(token: ReadState<TState>) {
  return token[_getValue]();
}

export function setTokenValue<TState>(
  token: WriteState<TState>,
  newValue: TState
) {
  return token[_setValue](newValue);
}

export function subscribeToTokenValue<TState>(
  token: ReadState<TState>,
  listener: TokenValueListener<TState>
): Disposer {
  return token[_subscribe](listener);
}

////////////////
// React API
////////////////
export function useStateToken<T>(initializer: T | (() => T)): Token<State<T>> {
  const token = useToken();
  const stateToken = useTokenExtension(token, () => addState(initializer));
  return stateToken;
}

export function useTokenValue<TState>(token: ReadState<TState>) {
  const [value, setValue] = useState<TState>(getTokenValue(token));
  useEffect(() => subscribeToTokenValue(token, setValue), [token]);
  return value;
}

export function useTokenSetter<T>(token: WriteState<T>): Dispatch<T> {
  return value => setTokenValue(token, value);
}

export function useTokenState<TReadState, TWriteState = TReadState>(
  token: ReadState<TReadState> & WriteState<TWriteState>
): [TReadState, Dispatch<TWriteState>] {
  return [useTokenValue(token), useTokenSetter(token)];
}
