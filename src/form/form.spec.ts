import { renderHook } from '@testing-library/react-hooks';
import { expectTypeOf } from 'expect-type';
import { array, object, string } from 'yup';
import { Path } from '../path';
import { State } from '../state';
import { PartialToken, Token } from '../token';
import { ErrorMessage, getTokenErrorMessage } from './error-message';
import { FormState, useFormToken } from './form';
import { Schema } from './schema';
import { TouchedInfo } from './touched';
import { Validated } from './validation';

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

  describe('types', () => {
    it('form token should be assignable to form token', () => {
      expectTypeOf<Token<FormState<string>>>().toMatchTypeOf<
        Token<FormState<string>>
      >();
    });

    it('form token should be assignable to state token', () => {
      expectTypeOf<Token<FormState<string>>>().toMatchTypeOf<
        Token<State<string>>
      >();
    });

    it('form of any should not be assignable form of string', () => {
      expectTypeOf<Token<FormState<any>>>().not.toMatchTypeOf<
        Token<FormState<string>>
      >();
    });

    it('form of any should be assignable form of string using partial token', () => {
      expectTypeOf<Token<FormState<any>>>().toMatchTypeOf<
        PartialToken<FormState<string>>
      >();
    });

    it('form of string should be assignable to form of any', () => {
      expectTypeOf<Token<FormState<string>>>().toMatchTypeOf<
        Token<FormState<any>>
      >();
    });

    it('form of string should be assignable to form of any using partial token', () => {
      expectTypeOf<Token<FormState<string>>>().toMatchTypeOf<
        PartialToken<FormState<any>>
      >();
    });

    it('single type form should be assignable to multi type', () => {
      expectTypeOf<Token<FormState<string>>>().toMatchTypeOf<
        Token<FormState<string | undefined>>
      >();
    });

    it('base features should be assignable to form feature using partial token', () => {
      expectTypeOf<
        Token<
          State<string> & Path & ErrorMessage & Validated & Schema & TouchedInfo
        >
      >().toMatchTypeOf<PartialToken<FormState<string>>>();
    });
  });
});
