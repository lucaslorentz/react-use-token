import { renderHook } from '@testing-library/react-hooks';
import { array, object, string } from 'yup';
import { getTokenError } from './error';
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

    await new Promise(r => setTimeout(r, 0));

    console.log(formToken);
    console.log(formToken.firstName);

    expect(getTokenError(formToken.firstName)).toBe(
      'First name is a required field'
    );
    expect(getTokenError(formToken.lastName)).toBe(
      'Last name is a required field'
    );
    expect(getTokenError(formToken.children[0])).toBe(
      'Child is a required field'
    );
  });
});
