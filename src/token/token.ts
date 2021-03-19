import { useEffect, useState } from 'react';
import { IfNever } from '../utils/types';
import {
  AnyFeature,
  ChildFeatures,
  CleanupFeatures,
  FeaturesPayload,
  FeaturesTransformation,
  NoFeature,
  TransformFeatures,
} from './feature';

export const _children = Symbol('children');
export const _childrenExtension = Symbol('childrenExtension');
export const _dispose = Symbol('dispose');
const _proxy = Symbol('proxy');
const _target = Symbol('target');

export interface TokenBase {
  [_children]: Record<PropertyKey, any>;
  [_childrenExtension]: ChildTokenExtension<NoFeature, any>;
  [_dispose]: () => void;
}

export type PartialToken<Features extends AnyFeature> = TokenBase &
  IfNever<Features, unknown, FeaturesPayload<Features>>;

export type Token<Features extends AnyFeature> = PartialToken<Features> &
  ChildTokensProperties<Features>;

export type ChildTokensProperties<Features extends AnyFeature> = {
  readonly [k in keyof ChildFeatures<Features>]: Token<
    CleanupFeatures<ChildFeatures<Features>[k]>
  >;
};

const positiveIntegerRegex = /^\d+$/;

const proxyHandler: ProxyHandler<TokenBase> = {
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
    let convertedProperty =
      typeof property === 'string' && positiveIntegerRegex.test(property)
        ? parseInt(property)
        : property;
    // Reuse existing child token
    let childToken = target[_children]![convertedProperty as any];
    if (!childToken) {
      // Create new child token
      childToken = new TokenBuilder()
        .extend(builder =>
          target[_childrenExtension](builder, target, convertedProperty)
        )
        .build();
      target[_children]![convertedProperty as any] = childToken;
    }
    return childToken;
  },
};

export function restoreToken<Features extends AnyFeature>(
  partialToken: PartialToken<Features>
): Token<Features> {
  return toProxy(partialToken);
}

function toProxy<Features extends AnyFeature>(
  token: PartialToken<Features>
): Token<Features> {
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

export function getProxyTarget<Features extends AnyFeature>(
  tokenProxy: PartialToken<Features>
): PartialToken<Features> {
  return (tokenProxy as any)[_target];
}

export interface TokenExtension<
  Features extends AnyFeature,
  Transformations extends FeaturesTransformation = {}
> {
  (builder: TokenBuilder<Features>): TokenBuilder<any, Transformations>;
}

interface ChildTokenExtension<
  FeaturesBefore extends AnyFeature,
  FeaturesAfter extends AnyFeature
> {
  (
    token: TokenBuilder<FeaturesBefore>,
    parentToken: Token<FeaturesAfter>,
    property: PropertyKey
  ): TokenBuilder<FeaturesAfter>;
}

export function disposeToken(token: PartialToken<never>): void {
  token[_dispose]();
}

////////////////
// React API
////////////////
export function useToken(): Token<NoFeature>;
export function useToken<Transformations extends FeaturesTransformation>(
  extension: TokenExtension<NoFeature, Transformations>
): Token<TransformFeatures<NoFeature, Transformations>>;
export function useToken(extension?: any): any {
  const [token] = useState(() => {
    let builder: TokenBuilder<NoFeature, any> = new TokenBuilder();
    if (extension) {
      builder = builder.extend(extension);
    }
    return builder.build();
  });
  useEffect(() => () => disposeToken(token), [token]);
  return token;
}

export function useTokenExtension<
  Features extends BaseFeatures,
  BaseFeatures extends AnyFeature = Features,
  Transformations extends FeaturesTransformation = {}
>(
  token: Token<Features>,
  extension: TokenExtension<BaseFeatures, Transformations>
): Token<TransformFeatures<Features, Transformations>> {
  const [newToken] = useState(() => {
    return new TokenBuilder(token).extend(extension as any).build();
  });
  useEffect(() => () => disposeToken(newToken), [newToken]);
  return newToken as any;
}

export class TokenBuilder<
  Features extends AnyFeature = NoFeature,
  Transformations extends FeaturesTransformation = {}
> {
  private partialToken: PartialToken<Features>;

  constructor(baseToken?: Token<Features>) {
    this.partialToken = Object.create(
      baseToken ? getProxyTarget(baseToken) : Object.prototype
    );

    if (!baseToken) {
      Object.assign(this.partialToken, {
        [_childrenExtension]: (token => token) as ChildTokenExtension<
          NoFeature,
          NoFeature
        >,
      });
    }

    Object.assign(this.partialToken, {
      [_children]: {},
      [_dispose]: () => {},
    });
  }

  public replaceFeature<
    OldFeatures extends AnyFeature,
    NewFeatures extends AnyFeature
  >(
    featureDescription: FeatureDescription<Features, NewFeatures>
  ): TokenBuilder<
    TransformFeatures<
      Features,
      {
        remove: OldFeatures;
        add: NewFeatures;
      }
    >,
    Transformations & {
      remove: OldFeatures;
      add: NewFeatures;
    }
  > {
    return this.addFeature<NewFeatures>(featureDescription) as any;
  }

  public addFeature<NewFeatures extends AnyFeature>(
    featureDescription: FeatureDescription<Features, NewFeatures>
  ): TokenBuilder<
    TransformFeatures<
      Features,
      {
        add: NewFeatures;
      }
    >,
    Transformations & {
      add: NewFeatures;
    }
  > {
    const { extend, extendChildren, dispose } = featureDescription;

    this.partialToken = Object.create(this.partialToken);

    if (extend) {
      Object.assign(this.partialToken, extend);
    }

    if (extendChildren) {
      const interceptor = this.partialToken[_childrenExtension];
      if (typeof extendChildren === 'function') {
        this.partialToken[_childrenExtension] = (
          childTokenBuilder,
          parentToken,
          property
        ) => {
          return interceptor(
            childTokenBuilder,
            parentToken,
            property
          ).addFeature({
            extend: extendChildren(
              childTokenBuilder.partialToken as any,
              parentToken as any,
              property
            ),
            extendChildren: extendChildren as any,
          });
        };
      } else {
        this.partialToken[_childrenExtension] = (
          childTokenBuilder,
          parent,
          property
        ) => {
          return interceptor(childTokenBuilder, parent, property).addFeature({
            extend: extend,
            extendChildren: extendChildren,
          });
        };
      }
    }

    if (dispose) {
      const previousDispose = this.partialToken[_dispose];
      Object.assign(this.partialToken, {
        [_dispose]: () => {
          previousDispose();
          dispose();
        },
      });
    }

    return this as any;
  }

  public extend<
    BaseFeatures extends AnyFeature = Features,
    NewTransformations extends FeaturesTransformation = {}
  >(
    extension: TokenExtension<BaseFeatures, NewTransformations>
  ): TokenBuilder<
    TransformFeatures<Features, NewTransformations>,
    Transformations & NewTransformations
  > {
    extension(this as any);
    return this as any;
  }

  public peek(): PartialToken<Features> {
    return this.partialToken;
  }

  public build(): Token<Features> {
    return restoreToken(this.partialToken);
  }
}

export interface FeatureDescription<
  BaseFeatures extends AnyFeature,
  NewFeature extends AnyFeature
> {
  extend: Omit<NewFeature['payload'], keyof BaseFeatures['payload']>;
  extendChildren?:
    | boolean
    | ((
        childToken: PartialToken<BaseFeatures>,
        parentToken: Token<NewFeature>,
        property: PropertyKey
      ) => Omit<NewFeature['payload'], keyof BaseFeatures['payload']>);
  dispose?: () => void;
}
