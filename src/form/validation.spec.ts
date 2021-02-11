import { addState } from '../state';
import { createToken, extendToken } from '../token';
import { addValidation, getTokenValidationStatus } from './validation';

describe('form/validation', () => {
  it('with errors should flag as invalid', async () => {
    var token = extendToken(
      createToken(
        addState<any>(() => ({}))
      ),
      addValidation({
        validator: async (_: any) => {
          return {
            field1: 'Field1 is required',
          };
        },
      })
    );

    expect(getTokenValidationStatus(token)).toBe('pending');
    expect(getTokenValidationStatus(token.name)).toBe('pending');

    await new Promise(r => setTimeout(r, 500));

    expect(getTokenValidationStatus(token)).toBe('invalid');
    expect(getTokenValidationStatus(token.name)).toBe('invalid');
  });

  it('without errors should flag as valid', async () => {
    var token = extendToken(
      createToken(
        addState<any>(() => ({}))
      ),
      addValidation({
        validator: async (_: any) => {
          return {};
        },
      })
    );

    expect(getTokenValidationStatus(token)).toBe('pending');
    expect(getTokenValidationStatus(token.name)).toBe('pending');

    await new Promise(r => setTimeout(r, 500));

    expect(getTokenValidationStatus(token)).toBe('valid');
    expect(getTokenValidationStatus(token.name)).toBe('valid');
  });
});
