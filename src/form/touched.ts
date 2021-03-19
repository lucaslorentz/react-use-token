import { getTokenPath, Path } from '../path';
import { getTokenValue, setTokenValue, State, useTokenValue } from '../state';
import { FeatureBase, PartialToken, Token, TokenExtension } from '../token';

const _touchedToken = Symbol('touchedToken');

export interface TouchedFieldsState {
  [path: string]: boolean;
}

export interface TouchedInfo extends FeatureBase<'TouchedInfo', TouchedInfo> {
  payload: {
    readonly [_touchedToken]: PartialToken<State<boolean, unknown>>;
  };
  childFeatures: {
    [P in PropertyKey]: TouchedInfo;
  };
}

export interface TouchedOptions {
  touchedFieldsToken: Token<State<TouchedFieldsState, unknown>>;
}

export function addTouched(
  options: TouchedOptions
): TokenExtension<Path, { add: TouchedInfo }> {
  const { touchedFieldsToken } = options;
  return builder => {
    const tokenBefore = builder.peek();
    return builder.addFeature<TouchedInfo>({
      extend: {
        [_touchedToken]: touchedFieldsToken[getTokenPath(tokenBefore)],
      },
      extendChildren: childToken => ({
        [_touchedToken]: touchedFieldsToken[getTokenPath(childToken)],
      }),
    });
  };
}

export function getTokenTouched(
  token: PartialToken<TouchedInfo>
): boolean | undefined {
  return getTokenValue(token[_touchedToken]);
}

export function setTokenTouched(
  token: PartialToken<TouchedInfo>,
  touched: boolean
): void {
  setTokenValue(token[_touchedToken], touched);
}

////////////////
// React API
////////////////
export function useTokenTouched(
  token: PartialToken<TouchedInfo> | undefined
): boolean {
  return Boolean(useTokenValue(token?.[_touchedToken]));
}
