import { SchemaOf, ValidationError } from 'yup';
import { Path } from '../path';
import { State, useStateToken } from '../state';
import {
  FeatureBase,
  Token,
  TokenExtension,
  useTokenExtension,
} from '../token';
import { NonFunctionProperties } from '../utils/types';
import { ErrorMessage, ErrorMessages } from './error-message';
import { addSchema, Schema } from './schema';
import { TouchedInfo } from './touched';
import { addValidation, Validated } from './validation';

export interface FormState<TRead, TWrite = TRead>
  extends FeatureBase<'FormState', FormState<TRead, TWrite>> {
  payload: State<TRead, TWrite>['payload'] &
    Path['payload'] &
    ErrorMessage['payload'] &
    Validated['payload'] &
    Schema['payload'] &
    TouchedInfo['payload'];
  baseFeatures: State<TRead, TWrite> &
    Path &
    ErrorMessage &
    Validated &
    Schema &
    TouchedInfo;
  childFeatures: State<TRead, TWrite>['childFeatures'] &
    Path['childFeatures'] &
    ErrorMessage['childFeatures'] &
    Validated['childFeatures'] &
    Schema['childFeatures'] &
    TouchedInfo['childFeatures'] &
    {
      [P in keyof NonFunctionProperties<NonNullable<TRead>> &
        keyof NonFunctionProperties<NonNullable<TWrite>> &
        PropertyKey]-?: FormState<
        | NonNullable<TRead>[P]
        | (TRead extends null | undefined ? undefined : never),
        NonNullable<TWrite>[P]
      >;
    };
}

export interface FormOptions<TState> {
  schema: SchemaOf<TState>;
  debounceValidationMs?: number;
}

export function addForm<TReadState, TWriteState>(
  options: FormOptions<TReadState>
): TokenExtension<
  State<TReadState, TWriteState>,
  { add: FormState<TReadState, TWriteState> }
> {
  const { schema, debounceValidationMs = 200 } = options;
  return builder =>
    builder.extend(addSchema(schema)).extend(
      addValidation<TReadState, TWriteState>({
        validator: async value => await validateForm(schema, value),
        debounceMs: debounceValidationMs,
      })
    );
}

async function validateForm(schema: SchemaOf<any>, value: any) {
  const errors: ErrorMessages = {};
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
  return useTokenExtension(valueToken, builder =>
    builder.extend(addForm<TState, TState>(options))
  );
}
