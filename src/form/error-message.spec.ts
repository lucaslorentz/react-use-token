import { addPath } from '../path/path';
import { addState } from '../state';
import { TokenBuilder } from '../token';
import { addErrorMessages, getTokenErrorMessage } from './error-message';

describe('form/error', () => {
  const initialErrors = {
    name: 'name error',
    'children[0].name': 'first child name error',
  };

  it('should return errors by field', () => {
    var errorsStateToken = new TokenBuilder()
      .extend(addPath())
      .extend(addState<Record<string, string>>(initialErrors))
      .build();

    var showAllErrorsToken = new TokenBuilder()
      .extend(addPath())
      .extend(addState(false))
      .build();

    var errorToken = new TokenBuilder()
      .extend(addPath())
      .extend(
        addErrorMessages({
          errorsToken: errorsStateToken,
          showAllErrorsToken: showAllErrorsToken,
        })
      )
      .build();

    expect(getTokenErrorMessage(errorToken.name)).toBe(initialErrors['name']);

    expect(getTokenErrorMessage(errorToken.children[0].name)).toBe(
      initialErrors['children[0].name']
    );
  });
});
