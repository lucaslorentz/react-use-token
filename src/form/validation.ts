import { addPath, Path } from '../path';
import {
  addState,
  getTokenValue,
  setTokenValue,
  State,
  subscribeToTokenValue,
  useTokenValue,
} from '../state';
import {
  FeatureBase,
  PartialToken,
  Token,
  TokenBuilder,
  TokenExtension,
} from '../token';
import { debounce } from '../utils/debounce';
import { addErrorMessages, ErrorMessage, ErrorMessages } from './error-message';
import { TouchedFieldsState, addTouched, TouchedInfo } from './touched';

export type ValidationStatusValues =
  | 'pending'
  | 'validating'
  | 'invalid'
  | 'valid';

const _validationStatusToken = Symbol('validationStatusToken');

export interface ValidationStatus
  extends FeatureBase<'ValidationStatus', ValidationStatus> {
  payload: {
    readonly [_validationStatusToken]: Token<State<ValidationStatusValues>>;
  };
  childFeatures: {
    [P in PropertyKey]: ValidationStatus;
  };
}

export interface Validated extends FeatureBase<'Validated', Validated> {
  payload: Path['payload'] &
    ErrorMessage['payload'] &
    TouchedInfo['payload'] &
    ValidationStatus['payload'] & {
      readonly [_validationStatusToken]: Token<State<ValidationStatusValues>>;
    };
  baseFeatures: Path & ErrorMessage & TouchedInfo & ValidationStatus;
  childFeatures: {
    [P in PropertyKey]: Validated;
  };
}

export type StateValidator<TState> = (
  value: TState | undefined
) => Promise<ErrorMessages>;

export interface ValidationOptions<TState> {
  validator: StateValidator<TState>;
  debounceMs?: number;
}

export function addValidation<TReadState, TWriteState>(
  options: ValidationOptions<TReadState>
): TokenExtension<
  State<TReadState, TWriteState>,
  { add: ErrorMessage & Validated }
> {
  const { validator, debounceMs = 200 } = options;

  return builder => {
    const errorsToken = new TokenBuilder()
      .extend(addPath())
      .extend(addState<ErrorMessages>({}))
      .build();

    const showAllErrorsToken = new TokenBuilder()
      .extend(addPath())
      .extend(addState<boolean>(false))
      .build();

    const validationStatusToken = new TokenBuilder()
      .extend(addPath())
      .extend(addState<ValidationStatusValues>('pending'))
      .build();

    const touchedFieldsToken = new TokenBuilder()
      .extend(addPath())
      .extend(addState<TouchedFieldsState>({}))
      .build();

    let lastStateVersion = 0;
    let pendingTouched: Record<string, boolean> = {};

    const debouncedValidate = debounce(
      async (newValue: TReadState, version: number) => {
        setTokenValue(validationStatusToken, 'validating');
        const errors = await validator(newValue);

        if (lastStateVersion !== version) return;

        if (process.env.NODE_ENV !== 'production') {
          console.info('Validation errors:', errors);
        }

        setTokenValue(errorsToken, errors);
        setTokenValue(
          validationStatusToken,
          Object.keys(errors).length === 0 ? 'valid' : 'invalid'
        );
        setTokenValue(touchedFieldsToken, {
          ...getTokenValue(touchedFieldsToken),
          ...pendingTouched,
        });
      },
      debounceMs
    );

    const tokenBefore = builder.peek();

    const disposeSubscription = subscribeToTokenValue(
      tokenBefore,
      async (newValue, path) => {
        setTokenValue(validationStatusToken, 'pending');
        lastStateVersion++;
        pendingTouched[path] = true;
        debouncedValidate(newValue, lastStateVersion);
      }
    );

    debouncedValidate(getTokenValue(tokenBefore), lastStateVersion);

    return builder
      .extend(
        addErrorMessages({
          errorsToken: errorsToken,
          showAllErrorsToken: showAllErrorsToken,
        })
      )
      .extend(
        addTouched({
          touchedFieldsToken,
        })
      )
      .addFeature<Validated>({
        extend: {
          [_validationStatusToken]: validationStatusToken,
        },
        extendChildren: true,
        dispose: () => {
          disposeSubscription();
        },
      });
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
): ValidationStatusValues;
export function useTokenValidationStatus(
  token: PartialToken<ValidationStatus> | undefined
): ValidationStatusValues | undefined;
export function useTokenValidationStatus(
  token: PartialToken<ValidationStatus> | undefined
): ValidationStatusValues | undefined {
  return useTokenValue(token?.[_validationStatusToken]);
}
