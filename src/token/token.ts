import { useState } from 'react';

const _children = Symbol('children');
const _childrenInterceptor = Symbol('childrenInterceptor');
export const _metadata = Symbol('metadata');
const _proxy = Symbol('proxy');
const _target = Symbol('target');

interface TokenBase {
  [_children]?: Record<PropertyKey, any>;
  [_childrenInterceptor]: ChildTokenInterceptor;
}

export interface NoFeature {}

export type PartialToken<Features> = TokenBase &
  Omit<Features, typeof _metadata>;

export type Token<Features> = PartialToken<Features> &
  ChildTokensProperties<Features>;

type ChildTokensProperties<Features> = {
  readonly [k in keyof ChildFeaturesProperties<Features>]: Token<
    CleanupFeatures<ChildFeaturesProperties<Features>[k]>
  >;
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

export function createToken(): Token<NoFeature>;
export function createToken<Feature>(
  extension?: TokenExtension<NoFeature, Feature>
): Token<CleanupFeatures<NoFeature & Feature>>;
export function createToken<Feature>(
  extension?: TokenExtension<NoFeature, Feature>
): Token<NoFeature> | Token<CleanupFeatures<NoFeature & Feature>> {
  if (!extension) {
    return rootToken;
  }
  return extendToken(rootToken, extension);
}

export function extendToken<
  CurrentFeatures extends BaseFeature,
  BaseFeature,
  NewFature
>(
  token: Token<CurrentFeatures>,
  extension: TokenExtension<BaseFeature, NewFature>
): Token<CleanupFeatures<CurrentFeatures & NewFature>> {
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
  return toProxy(newToken) as any;
}

export function restoreToken<Features>(
  partialToken: PartialToken<Features>
): Token<Features> {
  return toProxy(partialToken);
}

function toProxy<Features>(token: PartialToken<Features>): Token<Features> {
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
  tokenProxy: PartialToken<Features>
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
    ) => Token<CleanupFeatures<BaseFeatures & NewFeatures>>);

export type FeatureMetadata<
  UniqueIdentifier extends string,
  Self,
  BaseFeatures,
  ChildFeatures
> = {
  self: BaseFeatures extends { [K in typeof _metadata]?: { self: infer S } }
    ? S & { [U in UniqueIdentifier]?: Self }
    : { [U in UniqueIdentifier]?: Self };
  baseFeatures: BaseFeatures extends {
    [K in typeof _metadata]?: { baseFeatures: infer B };
  }
    ? B & { [U in UniqueIdentifier]?: BaseFeatures }
    : { [U in UniqueIdentifier]?: BaseFeatures };
  childFeatures: BaseFeatures extends {
    [K in typeof _metadata]?: { childFeatures: infer C };
  }
    ? C & { [U in UniqueIdentifier]?: ChildFeatures }
    : { [U in UniqueIdentifier]?: ChildFeatures };
};

type GetIdentifiers<Features> = Features extends {
  [K in typeof _metadata]?: {
    self: infer T;
  };
}
  ? keyof T
  : never;

type GetNonBaseIdentifiers<Features> = Exclude<
  GetIdentifiers<Features>,
  GetIdentifiers<GetBaseFeatures<Features>>
>;

type GetBaseFeatures<Features> = UnionToIntersection<
  Features extends {
    [C in typeof _metadata]?: {
      baseFeatures: {
        [U in string]?: infer Base;
      };
    };
  }
    ? Base
    : never
>;

type CleanupFeatures<Features> = UnionToIntersection<
  Features extends {
    [C in typeof _metadata]?: {
      self: {
        [U in GetNonBaseIdentifiers<Features>]?: infer Self;
      };
    };
  }
    ? Self
    : never
>;

type ChildFeaturesProperties<Features> = UnionToIntersection<
  Features extends {
    [K in typeof _metadata]?: {
      childFeatures: {
        [U in string]?: infer T;
      };
    };
  }
    ? T
    : never
>;

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
export function useToken(): Token<NoFeature>;
export function useToken<Feature>(
  extensionFactory?: () => TokenExtension<NoFeature, Feature>
): Token<Feature>;
export function useToken<Feature>(
  extensionFactory?: () => TokenExtension<NoFeature, Feature>
): Token<NoFeature> | Token<CleanupFeatures<NoFeature & Feature>> {
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
