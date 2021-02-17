import { getTokenPath, Path } from '../path';
import { getTokenValue, ReadState, useTokenValue } from '../state';
import {
  extendToken,
  FeatureMetadata,
  NoFeature,
  PartialToken,
  Token,
  TokenExtension,
  _metadata,
} from '../token';

const _errorToken = Symbol('errorToken');

export interface ErrorsState {
  [path: string]: string;
}

export interface ErrorMessage {
  readonly [_errorToken]: PartialToken<ReadState<string>>;
  [_metadata]: FeatureMetadata<
    'error',
    ErrorMessage,
    NoFeature,
    {
      [P in PropertyKey]: ErrorMessage;
    }
  >;
}

export interface ErrorOptions {
  errorsToken: Token<ReadState<ErrorsState>>;
}

export function addErrorMessages(
  options: ErrorOptions
): TokenExtension<Path, ErrorMessage> {
  const { errorsToken } = options;
  return token =>
    extendToken(token, {
      extend: {
        [_errorToken]: errorsToken[getTokenPath(token)],
      },
      extendChildren: childToken => ({
        [_errorToken]: errorsToken[getTokenPath(childToken)],
      }),
    } as TokenExtension<Path, ErrorMessage>);
}

export function getTokenErrorMessage(
  token: PartialToken<ErrorMessage>
): string | undefined {
  return getTokenValue(token[_errorToken]);
}

////////////////
// React API
////////////////
export function useTokenErrorMessage(
  token: PartialToken<ErrorMessage>
): string | undefined {
  return useTokenValue(token[_errorToken]);
}
