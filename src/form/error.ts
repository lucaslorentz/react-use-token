import { getTokenPath, Path } from '../path';
import { getTokenValue, ReadState, useTokenValue } from '../state';
import {
  DeclareChildFeatures,
  extendToken,
  Token,
  TokenExtension,
  _childFeatures,
} from '../token';

const _errorToken = Symbol('errorToken');

export interface ErrorsState {
  [path: string]: string;
}

export interface Error<TState = any> extends Path<TState> {
  readonly [_errorToken]: ReadState<string>;
  [_childFeatures]?: DeclareChildFeatures<
    Path<TState>,
    'error',
    {
      [P in keyof NonNullable<TState>]-?: Error<NonNullable<TState>[P]>;
    }
  >;
}

export interface ErrorOptions {
  errorsToken: Token<ReadState<ErrorsState>>;
}

export function addError<TState = any>(
  options: ErrorOptions
): TokenExtension<Path<TState>, Error<TState>> {
  const { errorsToken } = options;
  return token =>
    extendToken(token, {
      extend: {
        [_errorToken]: errorsToken[getTokenPath(token)],
      },
      extendChildren: childToken => ({
        [_errorToken]: errorsToken[getTokenPath(childToken)],
      }),
    });
}

export function getTokenError(token: Error): string | undefined {
  return getTokenValue(token[_errorToken]);
}

////////////////
// React API
////////////////
export function useTokenError(token: Error): string | undefined {
  return useTokenValue(token[_errorToken]);
}
