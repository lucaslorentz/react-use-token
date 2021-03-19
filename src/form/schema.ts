import { useMemo } from 'react';
import { AnySchema, reach } from 'yup';
import { FeatureBase, NoFeature, PartialToken, TokenExtension } from '../token';

const _schema = Symbol('schema');

export interface Schema extends FeatureBase<'Schema', Schema> {
  payload: {
    readonly [_schema]: AnySchema;
  };
  childFeatures: {
    [P in PropertyKey]: Schema;
  };
}

export function addSchema(
  schema: AnySchema
): TokenExtension<NoFeature, { add: Schema }> {
  return builder =>
    builder.addFeature<Schema>({
      extend: {
        [_schema]: schema as any,
      },
      extendChildren: (_, parent, property) => {
        const parentSchema = getTokenSchema(parent);
        const childSchema = parentSchema
          ? tryReach(parentSchema, String(property))
          : undefined;
        return {
          [_schema]: childSchema,
        };
      },
    });
}

export function getTokenSchema(token: PartialToken<Schema>): AnySchema {
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
  token: PartialToken<Schema> | undefined
): SchemaInfo {
  const schemaDescription = useMemo(() => {
    if (!token) return;
    const schema = getTokenSchema(token);
    if (!schema) return;
    return schema.describe();
  }, [token]);
  if (!schemaDescription) return {};
  return {
    label: schemaDescription.label,
    required: Boolean(schemaDescription.tests.find(t => t.name === 'required')),
  };
}
