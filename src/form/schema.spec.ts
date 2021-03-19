import { expectTypeOf } from 'expect-type';
import * as yup from 'yup';
import { AnySchema } from 'yup';
import { Token, TokenBuilder } from '../token';
import { addSchema, getTokenSchema, Schema } from './schema';

describe('form/schema', () => {
  const schema = yup.object({
    name: yup.string(),
    children: yup.array(
      yup.object({
        name: yup.string(),
      })
    ),
  });
  it('should return child schemas', () => {
    const token = new TokenBuilder().extend(addSchema(schema)).build();
    expect(getTokenSchema(token.name)).toBeDefined();
    expectTypeOf(token.name).toEqualTypeOf<Token<Schema>>();

    expect(getTokenSchema(token.children)).toBeDefined();
    expectTypeOf(token.children).toEqualTypeOf<Token<Schema>>();

    expect(getTokenSchema(token.children[0])).toBeDefined();
    expectTypeOf(token.children[0]).toEqualTypeOf<Token<Schema>>();

    expect(getTokenSchema(token.children[0].name)).toBeDefined();
    expectTypeOf(token.children[0].name).toEqualTypeOf<Token<Schema>>();
    expectTypeOf(getTokenSchema(token.children[0].name)).toEqualTypeOf<
      AnySchema
    >();
  });

  describe('types', () => {
    it('schema token should be assignable to schema token', () => {
      expectTypeOf<Token<Schema>>().toMatchTypeOf<Token<Schema>>();
    });
  });
});
