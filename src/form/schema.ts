import { useMemo } from 'react';
import { reach, SchemaOf } from 'yup';
import {
  FeatureMetadata,
  NoFeature,
  TokenExtension,
  _metadata,
} from '../token';

const _schema = Symbol('schema');

export interface Schema<TState> {
  readonly [_schema]: SchemaOf<TState>;
  [_metadata]?: FeatureMetadata<
    'schema',
    Schema<TState>,
    NoFeature,
    {
      [P in keyof NonNullable<TState>]-?: Schema<NonNullable<TState>[P]>;
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

export function getTokenSchema<T>(token: Schema<T>): SchemaOf<T> {
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
export function useTokenSchemaInfo(token: Schema<unknown>): SchemaInfo {
  const schemaDescription = useMemo(() => {
    return token[_schema]?.describe();
  }, [token]);
  if (!schemaDescription) return {};
  return {
    label: schemaDescription.label,
    required: Boolean(schemaDescription.tests.find(t => t.name === 'required')),
  };
}
