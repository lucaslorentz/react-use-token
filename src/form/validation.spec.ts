import { addState } from '../state';
import { createToken, extendToken } from '../token';
import { getTokenError } from './error';
import { addValidation, getTokenValidationStatus } from './validation';

describe('form/validation', () => {
  describe('with errors', () => {
    it('flag as invalid and return errors', async () => {
      var token = extendToken(
        createToken(
          addState<any>(() => ({}))
        ),
        addValidation({
          validator: async (_: any) => {
            return {
              name: 'Name is required',
            };
          },
        })
      );

      expect(getTokenValidationStatus(token)).toBe('pending');
      expect(getTokenError(token.name)).toBeUndefined();

      await new Promise(r => setTimeout(r, 500));

      expect(getTokenValidationStatus(token)).toBe('invalid');
      expect(getTokenError(token.name)).toBe('Name is required');
    });
  });

  describe('without errors', () => {
    it("flag as valid and doesn't return errors", async () => {
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
      expect(getTokenError(token.name)).toBeUndefined();

      await new Promise(r => setTimeout(r, 500));

      expect(getTokenValidationStatus(token)).toBe('valid');
      expect(getTokenError(token.name)).toBeUndefined();
    });
  });
});
