import * as yup from 'yup';
import { createToken } from '../token';
import { addFormSchema, getTokenSchema } from './schema';

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
    const token = createToken(addFormSchema(schema));
    expect(getTokenSchema(token.name)).toBeDefined();
    expect(getTokenSchema(token.children)).toBeDefined();
    expect(getTokenSchema(token.children[0])).toBeDefined();
    expect(getTokenSchema(token.children[0].name)).toBeDefined();
  });
});
