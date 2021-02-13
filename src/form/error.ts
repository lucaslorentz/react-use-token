import { getTokenPath, Path } from '../path';
import { getTokenValue, ReadState, useTokenValue } from '../state';
import {
  FeatureMetadata,
  extendToken,
  Token,
  TokenExtension,
  _metadata,
} from '../token';

const _errorToken = Symbol('errorToken');

export interface ErrorsState {
  [path: string]: string;
}

export interface Error<TState = any> extends Path<TState> {
  readonly [_errorToken]: ReadState<string>;
  [_metadata]?: FeatureMetadata<
    'error',
    Error<TState>,
    Path<TState>,
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
    } as TokenExtension<Path<TState>, Error<TState>>);
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
