import { addPath, Path } from '../path';
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
  extendToken,
  FeatureMetadata,
  NoFeature,
  PartialToken,
  Token,
  TokenExtension,
  _metadata,
} from '../token';
import { debounce } from '../utils/debounce';
import { addErrorMessages, ErrorMessage, ErrorsState } from './error-message';

export type ValidationStatusValues =
  | 'pending'
  | 'validating'
  | 'invalid'
  | 'valid';

const _validationStatusToken = Symbol('validationStatusToken');

export interface ValidationStatus {
  readonly [_validationStatusToken]: Token<
    ReadState<ValidationStatusValues> & WriteState<ValidationStatusValues>
  >;
  [_metadata]: FeatureMetadata<
    'validationStatus',
    ValidationStatusValues,
    NoFeature,
    {
      [P in PropertyKey]: ValidationStatusValues;
    }
  >;
}

export interface Validated extends Path, ErrorMessage, ValidationStatus {
  readonly [_validationStatusToken]: Token<
    ReadState<ValidationStatusValues> & WriteState<ValidationStatusValues>
  >;
  [_metadata]: FeatureMetadata<
    'validation',
    Validated,
    Path & ErrorMessage & ValidationStatus,
    {
      [P in PropertyKey]: Validated;
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
): TokenExtension<ReadState<TState>, Path & ErrorMessage & Validated> {
  const { validator, debounceMs = 200 } = options;

  return token => {
    const errorsToken = createToken(addState<ErrorsState>({}));

    const validationStatusToken = createToken(
      addState<ValidationStatusValues>('pending')
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

    subscribeToTokenValue(token, async newValue => {
      setTokenValue(validationStatusToken, 'pending');
      lastValidationVersion++;
      debouncedValidate(newValue, lastValidationVersion);
    });

    const tokenWithPath = extendToken(token, addPath());
    const tokenWithErrrors = extendToken(
      tokenWithPath,
      addErrorMessages({
        errorsToken: errorsToken,
      })
    );

    const tokenWithValidationStatus = extendToken(tokenWithErrrors, {
      extend: {
        [_validationStatusToken]: validationStatusToken,
      },
      extendChildren: true,
    } as TokenExtension<ErrorMessage, Validated>);

    debouncedValidate(getTokenValue(token), lastValidationVersion);

    return tokenWithValidationStatus;
  };
}

export function getTokenValidationStatus(
  token: PartialToken<ValidationStatus>
): ValidationStatusValues {
  return getTokenValue(token[_validationStatusToken]);
}

////////////////
// React API
////////////////
export function useTokenValidationStatus(
  token: PartialToken<ValidationStatus>
): ValidationStatusValues {
  return useTokenValue(token[_validationStatusToken]);
}
