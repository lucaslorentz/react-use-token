import { Dispatch, useLayoutEffect, useState } from 'react';
import { addPath, getTokenPath, Path } from '../path';
import {
  FeatureBase,
  PartialToken,
  Token,
  TokenExtension,
  useToken,
} from '../token';
import { NonFunctionProperties } from '../utils/types';

const _getValue = Symbol('getValue');
const _subscribe = Symbol('subscribe');
const _setValue = Symbol('setValue');

export interface State<TRead, TWrite = TRead>
  extends FeatureBase<'state', State<TRead, TWrite>> {
  payload: Path['payload'] & {
    [_getValue](): TRead;
    [_subscribe](listener: TokenValueListener<TRead>): Disposer;
    [_setValue](newValue: TWrite, path?: string): void;
  };
  baseFeatures: Path;
  childFeatures: Path['childFeatures'] &
    {
      [P in keyof NonFunctionProperties<NonNullable<TRead>>]-?: State<
        | NonNullable<TRead>[P]
        | (TRead extends null | undefined ? undefined : never),
        NonNullable<TRead>[P]
      >;
    };
}

export type TokenValueListener<TState> = (
  newValue: TState,
  path: string
) => void;
export type Disposer = () => void;

export function addState<TState>(
  initialValue: TState
): TokenExtension<Path, { add: State<TState> }> {
  return builder => {
    let value: TState = initialValue;

    const subscriptions = new Map<TokenValueListener<TState>, number>();

    const pathToken = builder.peek();

    return builder.addFeature<State<TState>>({
      extend: {
        [_getValue]: function() {
          return value!;
        },
        [_setValue]: function(
          newValue: TState,
          path: string = getTokenPath(pathToken)
        ) {
          value = newValue;
          notifySubscribers(subscriptions, newValue, path);
        },
        [_subscribe]: function(listener: TokenValueListener<TState>) {
          return addSubscription(subscriptions, listener);
        },
      },
      extendChildren: (childToken, parent, property) => ({
        [_getValue]: function() {
          var parentValue: any = parent[_getValue]();
          return parentValue?.[property];
        },
        [_setValue]: function(
          newValue: any,
          path: string = getTokenPath(childToken)
        ) {
          const base = typeof property === 'number' ? [] : {};
          parent[_setValue](
            Object.assign(base, parent[_getValue](), {
              [property]: newValue,
            }),
            path
          );
        },
        [_subscribe]: function(callback: TokenValueListener<TState>) {
          let snapshot = this[_getValue]();
          return parent[_subscribe]((newParentValue: any, path: string) => {
            const newValue = newParentValue?.[property];
            if (newValue !== snapshot) {
              snapshot = newValue;
              callback(newValue, path);
            }
          });
        },
      }),
    });
  };
}

export function transformState<
  TOldReadState,
  TNewReadState,
  TOldWriteState = TOldReadState,
  TNewWriteState = TNewReadState
>(
  convertRead: (value: TOldReadState) => TNewReadState,
  convertWrite: (value: TNewWriteState) => TOldWriteState
): TokenExtension<
  State<TOldReadState, TOldWriteState>,
  {
    remove: State<TOldReadState, TOldWriteState>;
    add: State<TNewReadState, TNewWriteState>;
  }
> {
  return builder => {
    let originalToken = builder.peek();

    let cachedValue = convertRead(originalToken[_getValue]());

    const subscriptions = new Map<TokenValueListener<TNewReadState>, number>();

    const disposeSubscription = subscribeToTokenValue(
      originalToken,
      (newOriginalValue, path) => {
        const newValue = convertRead(newOriginalValue);
        if (newValue !== cachedValue) {
          cachedValue = newValue;
          notifySubscribers(subscriptions, newValue, path);
        }
      }
    );

    return builder.replaceFeature<
      State<TOldReadState, TOldWriteState>,
      State<TNewReadState, TNewWriteState>
    >({
      extend: {
        [_getValue]: function() {
          return cachedValue;
        },
        [_setValue]: function(newValue: TNewWriteState) {
          originalToken[_setValue](convertWrite(newValue));
        },
        [_subscribe]: function(listener: TokenValueListener<TNewReadState>) {
          return addSubscription(subscriptions, listener);
        },
      },
      dispose: disposeSubscription,
    });
  };
}

function addSubscription<TState>(
  subscriptions: Map<TokenValueListener<TState>, number>,
  callback: TokenValueListener<TState>
) {
  let unsubscribed = false;
  const count = subscriptions.get(callback) ?? 0;
  subscriptions.set(callback, count + 1);
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;
    const count = subscriptions.get(callback) ?? 0;
    if (count <= 1) {
      subscriptions.delete(callback);
    } else {
      subscriptions.set(callback, count - 1);
    }
  };
}

function notifySubscribers<TState>(
  subscriptions: Map<TokenValueListener<TState>, number>,
  newValue: TState,
  path: string
) {
  Array.from(subscriptions.keys()).forEach(listener =>
    listener(newValue, path)
  );
}

export function getTokenValue<TState>(
  token: PartialToken<State<TState, unknown>>
) {
  return token[_getValue]();
}

export function setTokenValue<TState>(
  token: PartialToken<State<unknown, TState>>,
  newValue: TState
): void {
  token[_setValue](newValue);
}

export function subscribeToTokenValue<TState>(
  token: PartialToken<State<TState, unknown>>,
  listener: TokenValueListener<TState>
): Disposer {
  return token[_subscribe](listener);
}

////////////////
// React API
////////////////
export function useStateToken<T>(initializer: T | (() => T)): Token<State<T>> {
  return useToken(builder => {
    var initialValue: T =
      typeof initializer === 'function'
        ? (initializer as Function)()
        : initializer;

    return builder.extend(addPath()).extend(addState(initialValue));
  });
}

export function useTokenValue<TState>(
  token: PartialToken<State<TState, unknown>>
): TState;
export function useTokenValue<TState>(
  token: PartialToken<State<TState, unknown>> | undefined
): TState | undefined;
export function useTokenValue<TState>(
  token: PartialToken<State<TState, unknown>> | undefined
): TState | undefined {
  const [value, setValue] = useState<TState | undefined>(
    token ? getTokenValue(token) : undefined
  );
  useLayoutEffect(() => {
    if (!token) return;
    return subscribeToTokenValue(token, setValue);
  }, [token]);
  return value;
}

export function useTokenSetter<TState>(
  token: PartialToken<State<unknown, TState>>
): Dispatch<TState>;
export function useTokenSetter<TState>(
  token: PartialToken<State<unknown, TState>> | undefined
): Dispatch<TState> | undefined;
export function useTokenSetter<TState>(
  token: PartialToken<State<unknown, TState>> | undefined
): Dispatch<TState> | undefined {
  if (!token) return;
  return value => setTokenValue(token, value);
}

export function useTokenState<TReadState, TWriteState = TReadState>(
  token: PartialToken<State<TReadState, TWriteState>>
): [TReadState, Dispatch<TWriteState>];
export function useTokenState<TReadState, TWriteState = TReadState>(
  token: PartialToken<State<TReadState, TWriteState>> | undefined
): [TReadState | undefined, Dispatch<TWriteState> | undefined];
export function useTokenState<TReadState, TWriteState = TReadState>(
  token: PartialToken<State<TReadState, TWriteState>> | undefined
): [TReadState | undefined, Dispatch<TWriteState> | undefined] {
  return [useTokenValue(token), useTokenSetter(token)];
}
