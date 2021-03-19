import { getTokenPath, Path } from '../path';
import { getTokenValue, setTokenValue, State, useTokenValue } from '../state';
import { FeatureBase, PartialToken, Token, TokenExtension } from '../token';

const _errorToken = Symbol('errorToken');
const _showAllErrors = Symbol('showAllErrors');

export interface ErrorMessages {
  [path: string]: string;
}

export interface ErrorMessage
  extends FeatureBase<'ErrorMessage', ErrorMessage> {
  payload: {
    readonly [_errorToken]: PartialToken<State<string, unknown>>;
    readonly [_showAllErrors]: PartialToken<State<boolean>>;
  };
  childFeatures: {
    [P in PropertyKey]: ErrorMessage;
  };
}

export interface ErrorOptions {
  errorsToken: Token<State<ErrorMessages, unknown>>;
  showAllErrorsToken: Token<State<boolean>>;
}

export function addErrorMessages(
  options: ErrorOptions
): TokenExtension<Path, { add: ErrorMessage }> {
  const { errorsToken, showAllErrorsToken } = options;
  return builder => {
    const tokenBefore = builder.peek();
    return builder.addFeature<ErrorMessage>({
      extend: {
        [_errorToken]: errorsToken[getTokenPath(tokenBefore)],
        [_showAllErrors]: showAllErrorsToken,
      },
      extendChildren: childToken => ({
        [_errorToken]: errorsToken[getTokenPath(childToken)],
        [_showAllErrors]: showAllErrorsToken,
      }),
    });
  };
}

export function getTokenErrorMessage(
  token: PartialToken<ErrorMessage>
): string | undefined {
  return getTokenValue(token[_errorToken]);
}

export function getShowAllErrors(token: PartialToken<ErrorMessage>): boolean {
  return getTokenValue(token[_showAllErrors]);
}

export function setShowAllErrors(
  token: PartialToken<ErrorMessage>,
  value: boolean
): void {
  setTokenValue(token[_showAllErrors], value);
}

////////////////
// React API
////////////////
export function useTokenErrorMessage(
  token: PartialToken<ErrorMessage> | undefined
): string | undefined {
  return useTokenValue(token?.[_errorToken]);
}
