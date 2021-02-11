import { addPath } from '../path/path';
import { addState } from '../state';
import { createToken, extendToken } from '../token';
import { addError, getTokenError } from './error';

describe('form/error', () => {
  const initialErrors = {
    name: 'name error',
    'children.0.name': 'children.0.name error',
  };

  it('should return errors by field', () => {
    var errorsStateToken = createToken(
      addState<Record<string, string>>(() => initialErrors)
    );

    var errorToken = extendToken(
      createToken(addPath()),
      addError({ errorsToken: errorsStateToken })
    );

    expect(getTokenError(errorToken.name)).toBe(initialErrors['name']);

    expect(getTokenError(errorToken.children[0].name)).toBe(
      initialErrors['children.0.name']
    );
  });
});
