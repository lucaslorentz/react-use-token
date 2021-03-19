import { addPath } from '../path';
import { addState } from '../state';
import { TokenBuilder } from '../token';
import { getTokenErrorMessage } from './error-message';
import { addValidation, getTokenValidationStatus } from './validation';

describe('form/validation', () => {
  describe('with errors', () => {
    it('flag as invalid and return errors', async () => {
      var token = new TokenBuilder()
        .extend(addPath())
        .extend(addState<any>({}))
        .extend(
          addValidation({
            validator: async (_: any) => {
              return {
                name: 'Name is required',
              };
            },
            debounceMs: 1,
          })
        )
        .build();

      expect(getTokenValidationStatus(token)).toBe('pending');
      expect(getTokenErrorMessage(token.name)).toBeUndefined();

      await new Promise(r => setTimeout(r, 10));

      expect(getTokenValidationStatus(token)).toBe('invalid');
      expect(getTokenErrorMessage(token.name)).toBe('Name is required');
    });
  });

  describe('without errors', () => {
    it("flag as valid and doesn't return errors", async () => {
      var token = new TokenBuilder()
        .extend(addPath())
        .extend(addState<any>({}))
        .extend(
          addValidation({
            validator: async (_: any) => {
              return {};
            },
            debounceMs: 0,
          })
        )
        .build();

      expect(getTokenValidationStatus(token)).toBe('pending');
      expect(getTokenErrorMessage(token.name)).toBeUndefined();

      await new Promise(r => setTimeout(r, 10));

      expect(getTokenValidationStatus(token)).toBe('valid');
      expect(getTokenErrorMessage(token.name)).toBeUndefined();
    });
  });
});
