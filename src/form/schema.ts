import { useMemo } from 'react';
import { reach, SchemaOf } from 'yup';
import {
  FeatureMetadata,
  NoFeature,
  PartialToken,
  TokenExtension,
  _metadata,
} from '../token';
import { NonFunctionProperties } from '../utils/types';

const _schema = Symbol('schema');

export interface Schema<TState> {
  readonly [_schema]: SchemaOf<TState>;
  [_metadata]: FeatureMetadata<
    'schema',
    Schema<TState>,
    NoFeature,
    {
      [P in keyof NonFunctionProperties<NonNullable<TState>>]-?: Schema<
        NonNullable<TState>[P]
      >;
    }
  >;
}

export function addSchema<TState>(
  schema: SchemaOf<TState>
): TokenExtension<NoFeature, Schema<TState>> {
  return {
    extend: {
      [_schema]: schema,
    },
    extendChildren: (_, parent, property) => {
      const childSchema = tryReach(parent[_schema], String(property));
      return {
        [_schema]: childSchema,
      };
    },
  };
}

export function getTokenSchema<T>(token: PartialToken<Schema<T>>): SchemaOf<T> {
  return token[_schema];
}

function tryReach(obj: {}, path: string) {
  try {
    return reach(obj, path, null, null);
  } catch {
    return null;
  }
}

export interface SchemaInfo {
  label?: string;
  required?: boolean;
}

////////////////
// React API
////////////////
export function useTokenSchemaInfo(
  token: PartialToken<Schema<any>> | undefined
): SchemaInfo {
  const schemaDescription = useMemo(() => {
    if (!token) return;
    return getTokenSchema(token).describe();
  }, [token]);
  if (!schemaDescription) return {};
  return {
    label: schemaDescription.label,
    required: Boolean(schemaDescription.tests.find(t => t.name === 'required')),
  };
}
