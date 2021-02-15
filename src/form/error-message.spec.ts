import { addPath } from '../path/path';
import { addState } from '../state';
import { createToken, extendToken } from '../token';
import { addErrorMessages, getTokenErrorMessage } from './error-message';

describe('form/error', () => {
  const initialErrors = {
    name: 'name error',
    'children[0].name': 'first child name error',
  };

  it('should return errors by field', () => {
    var errorsStateToken = createToken(
      addState<Record<string, string>>(initialErrors)
    );

    var errorToken = extendToken(
      createToken(addPath()),
      addErrorMessages({ errorsToken: errorsStateToken })
    );

    expect(getTokenErrorMessage(errorToken.name)).toBe(initialErrors['name']);

    expect(getTokenErrorMessage(errorToken.children[0].name)).toBe(
      initialErrors['children[0].name']
    );
  });
});
