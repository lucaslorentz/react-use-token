import { useState } from 'react';

const _children = Symbol('children');
const _childrenInterceptor = Symbol('childrenInterceptor');
export const _childFeatures = Symbol('childFeatures');
const _proxy = Symbol('proxy');
const _target = Symbol('target');

interface TokenBase {
  [_children]?: Record<PropertyKey, any>;
  [_childrenInterceptor]: ChildTokenInterceptor;
}

export interface NoFeature {
  [_childFeatures]?: DeclareChildFeatures<
    undefined,
    'noFeature',
    {
      [P in PropertyKey]: NoFeature;
    }
  >;
}

export type Token<Features> = TokenBase &
  Features &
  {
    [P in ChildProperties<Features>]: Token<ChildFeatures<Features, P>>;
  };

const positiveIntegerRegex = /^\d+$/;

const proxyHandler: ProxyHandler<any> = {
  get(target, property, receiver) {
    // Special property to retrieve proxy target
    if (property === _target) {
      return target;
    }
    // If target has the property, return it from target
    if (Reflect.has(target, property)) {
      return Reflect.get(target, property, receiver);
    }
    // For some reason proxies properties are string even when accessed with proxy[n];
    if (typeof property === 'string' && positiveIntegerRegex.test(property)) {
      property = parseInt(property);
    }
    // Create field to track child tokens
    if (!target.hasOwnProperty(_children)) {
      target[_children] = {};
    }
    // Reuse existing child token
    let childToken = target[_children]![property as any];
    if (!childToken) {
      // Create new child token
      childToken = target[_childrenInterceptor]!(
        createToken(),
        target,
        property
      );
      target[_children]![property] = childToken;
    }
    return childToken;
  },
};

const rootToken = toProxy<NoFeature>({
  [_childrenInterceptor]: token => token,
});

export function createToken<Features = NoFeature>(
  extension?: TokenExtension<NoFeature, Features>
): Token<Features> {
  if (!extension) {
    return rootToken as Token<Features>;
  }
  return (extendToken(rootToken, extension) as unknown) as Token<Features>;
}

export function extendToken<
  CurrentFeatures extends BaseFeature,
  NewFature,
  BaseFeature = CurrentFeatures
>(
  token: Token<CurrentFeatures>,
  extension: TokenExtension<BaseFeature, NewFature>
): Token<
  NewFature extends CurrentFeatures ? NewFature : CurrentFeatures & NewFature
> {
  if (typeof extension === 'function') {
    return extension(token) as any;
  }

  const newToken = Object.create(getProxyTarget(token));
  Object.assign(newToken, extension.extend);

  const extendChildren = extension.extendChildren;
  if (extendChildren) {
    const interceptor = token[_childrenInterceptor];
    if (typeof extendChildren === 'function') {
      newToken[_childrenInterceptor] = ((token, parentToken, property) => {
        const childToken = interceptor(token, parentToken, property);
        return extendToken(childToken, {
          extend: extendChildren(childToken, parentToken, property),
          extendChildren: extendChildren,
        });
      }) as ChildTokenInterceptor;
    } else {
      newToken[_childrenInterceptor] = ((token, parent, property) => {
        const childToken = interceptor(token, parent, property);
        return extendToken(childToken, {
          extend: extension.extend,
          extendChildren: extendChildren,
        });
      }) as ChildTokenInterceptor;
    }
  }
  return toProxy(newToken);
}

function toProxy<Features>(token: TokenBase & Features): Token<Features> {
  if (token.hasOwnProperty(_proxy)) {
    return (token as any)[_proxy];
  }
  const proxy = new Proxy(token, proxyHandler);
  Object.defineProperty(token, _proxy, {
    value: proxy,
    configurable: false,
    writable: false,
  });
  return proxy as any;
}

function getProxyTarget<Features>(
  tokenProxy: Token<Features>
): TokenBase & Features {
  return (tokenProxy as any)[_target];
}

export type TokenExtension<BaseFeatures, NewFeatures> =
  | {
      extend: Omit<NewFeatures, keyof BaseFeatures>;
      extendChildren?:
        | boolean
        | ((
            token: Token<BaseFeatures>,
            parentToken: Token<BaseFeatures & NewFeatures>,
            property: PropertyKey
          ) => Omit<NewFeatures, keyof BaseFeatures>);
    }
  | ((
      token: Token<BaseFeatures>
    ) => Token<
      NewFeatures extends BaseFeatures
        ? NewFeatures
        : BaseFeatures & NewFeatures
    >);

export type ChildFeatures<
  Features,
  Property extends PropertyKey
> = UnionToIntersection<
  Features extends {
    [C in typeof _childFeatures]?: {
      [I in string]?: { [P in Property]: infer T };
    };
  }
    ? T
    : {}
>;

export type ChildProperties<Features> = Features extends {
  [K in typeof _childFeatures]?: { [i in string]?: infer T };
}
  ? keyof NonNullable<T>
  : never;

export type DeclareChildFeatures<
  OmitFeatures,
  UniqueIdentifier extends string,
  ChildFeatures
> = (OmitFeatures extends { [K in typeof _childFeatures]?: infer T }
  ? {
      [P in keyof T]: never;
    }
  : {}) &
  { [P in UniqueIdentifier]?: ChildFeatures };

type ChildTokenInterceptor = (
  token: any,
  parentToken: any,
  property: PropertyKey
) => any;

// https://fettblog.eu/typescript-union-to-intersection/
type UnionToIntersection<T> = (T extends any
? (x: T) => any
: never) extends (x: infer R) => any
  ? R
  : never;

////////////////
// React API
////////////////
export function useToken<Feature = NoFeature>(
  extensionFactory?: () => TokenExtension<NoFeature, Feature>
): Token<Feature> {
  const [token] = useState(() => {
    return createToken(extensionFactory?.());
  });
  return token;
}

export function useTokenExtension<
  CurrentFeatures extends BaseFeatures,
  NewFeatures,
  BaseFeatures = CurrentFeatures
>(
  token: Token<CurrentFeatures>,
  extensionFactory: () => TokenExtension<BaseFeatures, NewFeatures>
): Token<
  NewFeatures extends CurrentFeatures
    ? NewFeatures
    : CurrentFeatures & NewFeatures
> {
  const [newToken] = useState(() => {
    return extendToken(token, extensionFactory());
  });
  return newToken as any;
}
