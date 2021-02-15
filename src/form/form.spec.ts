import { renderHook } from '@testing-library/react-hooks';
import { array, object, string } from 'yup';
import { getTokenErrorMessage } from './error-message';
import { useFormToken } from './form';

describe('form', () => {
  const schema = object({
    firstName: string()
      .label('First name')
      .required(),
    lastName: string()
      .label('Last name')
      .required(),
    children: array(
      string()
        .label('Child')
        .required()
    )
      .default([undefined])
      .required(),
  });

  it('flag as invalid and return errors', async () => {
    const { result } = renderHook(() =>
      useFormToken({ schema, debounceValidationMs: 0 })
    );

    const formToken = result.current;

    await new Promise(r => setTimeout(r, 10));

    expect(getTokenErrorMessage(formToken.firstName)).toBe(
      'First name is a required field'
    );
    expect(getTokenErrorMessage(formToken.lastName)).toBe(
      'Last name is a required field'
    );
    expect(getTokenErrorMessage(formToken.children[0])).toBe(
      'Child is a required field'
    );
  });
});
