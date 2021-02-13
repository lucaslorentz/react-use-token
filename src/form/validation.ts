import { addPath } from '../path';
import {
  addState,
  getTokenValue,
  ReadState,
  setTokenValue,
  subscribeToTokenValue,
  useTokenValue,
  WriteState,
} from '../state';
import {
  createToken,
  FeatureMetadata,
  extendToken,
  Token,
  TokenExtension,
  _metadata,
} from '../token';
import { debounce } from '../utils/debounce';
import { addError, Error, ErrorsState } from './error';

export type ValidationStatus = 'pending' | 'validating' | 'invalid' | 'valid';

const _validationStatusToken = Symbol('validationStatusToken');

export interface Validated<TState> extends Error<TState> {
  readonly [_validationStatusToken]: Token<
    ReadState<ValidationStatus> & WriteState<ValidationStatus>
  >;
  [_metadata]?: FeatureMetadata<
    'validation',
    Validated<TState>,
    Error<TState>,
    {
      [P in keyof NonNullable<TState>]-?: Validated<NonNullable<TState>[P]>;
    }
  >;
}

export type StateValidator<TState> = (
  value: TState | undefined
) => Promise<ErrorsState>;

export interface ValidationOptions<TState> {
  validator: StateValidator<TState>;
  debounceMs?: number;
}

export function addValidation<TState>(
  options: ValidationOptions<TState>
): TokenExtension<ReadState<TState>, Validated<TState>> {
  const { validator, debounceMs = 200 } = options;

  return token => {
    const errorsToken = createToken(
      addState<ErrorsState>(() => ({}))
    );

    const validationStatusToken = createToken(
      addState<ValidationStatus>(() => 'pending')
    );

    let lastValidationVersion = 0;

    const debouncedValidate = debounce(
      async (newValue: TState, version: number) => {
        setTokenValue(validationStatusToken, 'validating');
        const errors = await validator(newValue);

        if (lastValidationVersion !== version) return;

        if (process.env.NODE_ENV !== 'production') {
          console.info('Validation errors:', errors);
        }

        setTokenValue(errorsToken, errors);
        setTokenValue(
          validationStatusToken,
          Object.keys(errors).length === 0 ? 'valid' : 'invalid'
        );
      },
      debounceMs
    );

    debouncedValidate(getTokenValue(token), lastValidationVersion);

    subscribeToTokenValue(token, async newValue => {
      setTokenValue(validationStatusToken, 'pending');
      lastValidationVersion++;
      debouncedValidate(newValue, lastValidationVersion);
    });

    const tokenWithPath = extendToken(token, addPath<TState>());
    const tokenWithErrrors = extendToken(
      tokenWithPath,
      addError<TState>({
        errorsToken: errorsToken,
      })
    );

    const tokenWithValidationStatus = extendToken(tokenWithErrrors, {
      extend: {
        [_validationStatusToken]: validationStatusToken,
      },
      extendChildren: true,
    } as TokenExtension<Error<TState>, Validated<TState>>);

    return tokenWithValidationStatus;
  };
}

export function getTokenValidationStatus(
  token: Validated<any>
): ValidationStatus {
  return getTokenValue(token[_validationStatusToken]);
}

////////////////
// React API
////////////////
export function useTokenValidationStatus(
  token: Validated<any>
): ValidationStatus {
  return useTokenValue(token[_validationStatusToken]);
}
