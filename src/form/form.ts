import { SchemaOf, ValidationError } from 'yup';
import { Path } from '../path';
import { State, useStateToken } from '../state';
import {
  extendToken,
  FeatureMetadata,
  Token,
  TokenExtension,
  useTokenExtension,
  _metadata,
} from '../token';
import { NonFunctionProperties } from '../utils/types';
import { ErrorMessage, ErrorsState } from './error-message';
import { addSchema, Schema } from './schema';
import { addValidation, Validated } from './validation';

export interface FormState<TReadState, TWriteState = TReadState>
  extends State<TReadState, TWriteState>,
    Path,
    ErrorMessage,
    Validated,
    Schema<TReadState> {
  [_metadata]?: FeatureMetadata<
    'formState',
    FormState<TReadState, TWriteState>,
    State<TReadState, TWriteState> &
      Path &
      ErrorMessage &
      Validated &
      Schema<TReadState>,
    {
      [P in keyof NonFunctionProperties<NonNullable<TReadState>> &
        keyof NonFunctionProperties<NonNullable<TWriteState>> &
        PropertyKey]-?: FormState<
        | NonNullable<TReadState>[P]
        | (TReadState extends null | undefined ? undefined : never),
        NonNullable<TWriteState>[P]
      >;
    }
  >;
}

export interface FormOptions<TState> {
  schema: SchemaOf<TState>;
  debounceValidationMs?: number;
}

export function addForm<TState>(
  options: FormOptions<TState>
): TokenExtension<State<TState>, FormState<TState>> {
  const { schema, debounceValidationMs = 200 } = options;

  return token => {
    const schemaToken = extendToken(token, addSchema<TState>(schema));

    const validationToken = extendToken(
      schemaToken,
      addValidation<TState>({
        validator: async value => await validateForm(schema, value),
        debounceMs: debounceValidationMs,
      })
    );

    return (validationToken as unknown) as Token<FormState<TState>>;
  };
}

async function validateForm(schema: SchemaOf<any>, value: any) {
  const errors: ErrorsState = {};
  try {
    await schema.validate(value, {
      strict: true,
      abortEarly: false,
    });
  } catch (e) {
    if (ValidationError.isError(e)) {
      for (let error of e.inner) {
        if (!error.path) continue;

        if (errors[error.path]) {
          errors[error.path] += ' ' + error.message;
        } else {
          errors[error.path] = error.message;
        }
      }
    }
  }
  return errors;
}

////////////////
// React API
////////////////
export function useFormToken<TState>(
  options: FormOptions<TState>
): Token<FormState<TState>> {
  const { schema } = options;
  const valueToken = useStateToken<TState>(() => schema.getDefault() as TState);
  return useTokenExtension(valueToken, () => addForm(options));
}
