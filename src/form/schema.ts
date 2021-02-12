import { useMemo } from 'react';
import { reach, SchemaOf } from 'yup';
import {
  DeclareChildFeatures,
  NoFeature,
  TokenExtension,
  _childFeatures,
} from '../token';

const _schema = Symbol('schema');

export interface Schema<TState> {
  readonly [_schema]: SchemaOf<TState>;
  [_childFeatures]?: DeclareChildFeatures<
    NoFeature,
    'schema',
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
