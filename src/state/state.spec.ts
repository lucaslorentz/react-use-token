import { act, renderHook } from '@testing-library/react-hooks';
import { expectTypeOf } from 'expect-type';
import { PartialToken, Token, useTokenExtension } from '../token';
import {
  transformState,
  setTokenValue,
  State,
  useStateToken,
  useTokenSetter,
  useTokenValue,
} from './state';

describe('state', () => {
  it('should read and write state immutably', () => {
    const initialValue: Person = {
      name: 'John',
      children: [
        {
          name: 'Dorothy',
        },
      ],
    };

    const { result: useStateTokenResult } = renderHook(() =>
      useStateToken(initialValue)
    );

    const token = useStateTokenResult.current;

    const { result } = renderHook(() => {
      return {
        root: useTokenValue(token),
        name: useTokenValue(token.name),
        children: useTokenValue(token.children),
        children_0: useTokenValue(token.children[0]),
        children_0_name: useTokenValue(token.children[0].name),
        children_0_name_setter: useTokenSetter(token.children[0].name),
      };
    });

    expect(result.current.root).toBe(initialValue);
    expectTypeOf(result.current.root).toEqualTypeOf<Person>();

    expect(result.current.name).toBe(initialValue.name);
    expectTypeOf(result.current.name).toEqualTypeOf<string>();

    expect(result.current.children).toBe(initialValue.children);
    expectTypeOf(result.current.children).toEqualTypeOf<Person[] | undefined>();

    expect(result.current.children_0).toBe(initialValue.children![0]);
    expectTypeOf(result.current.children_0).toEqualTypeOf<Person | undefined>();

    expect(result.current.children_0_name).toBe(initialValue.children![0].name);
    expectTypeOf(result.current.children_0_name).toEqualTypeOf<
      string | undefined
    >();

    act(() => result.current.children_0_name_setter('Changed name'));

    expect(result.current.root).not.toBe(initialValue);
    expect(result.current.name).toBe(initialValue.name);
    expect(result.current.children).not.toBe(initialValue.children);
    expect(result.current.children_0).not.toBe(initialValue.children![0]);
    expect(result.current.children_0_name).toBe('Changed name');
  });

  it('should support state transformation', () => {
    const initialValue = 42;

    const { result: useStateTokenResult } = renderHook(() =>
      useStateToken(() => initialValue)
    );

    const token = useStateTokenResult.current;

    const { result: transformedStateTokenResult } = renderHook(() =>
      useTokenExtension(token, b =>
        b.extend(
          transformState<number, string>(
            v => v.toString(),
            s => parseFloat(s)
          )
        )
      )
    );

    const transformedToken = transformedStateTokenResult.current;

    const { result } = renderHook(() => {
      return {
        originalValue: useTokenValue(token),
        transformedValue: useTokenValue(transformedToken),
      };
    });

    expect(result.current.originalValue).toBe(initialValue);
    expectTypeOf(result.current.originalValue).toEqualTypeOf<number>();

    expect(result.current.transformedValue).toBe('42');
    expectTypeOf(result.current.transformedValue).toEqualTypeOf<string>();

    act(() => setTokenValue(transformedToken, '11'));

    expect(result.current.originalValue).toBe(11);
    expectTypeOf(result.current.originalValue).toEqualTypeOf<number>();

    expect(result.current.transformedValue).toBe('11');
    expectTypeOf(result.current.transformedValue).toEqualTypeOf<string>();
  });

  describe('types', () => {
    it('token should not be assignable to pure feature', () => {
      expectTypeOf<Token<State<string>>>().not.toMatchTypeOf<State<string>>();
    });

    it('state of any should not assignable to states of string', () => {
      expectTypeOf<Token<State<any>>>().not.toMatchTypeOf<
        Token<State<string>>
      >();
    });

    it('state of any should be assignable to state of string using partial token', () => {
      expectTypeOf<Token<State<any>>>().toMatchTypeOf<
        PartialToken<State<string>>
      >();
    });

    it('state of string should be assignable to state of any', () => {
      expectTypeOf<Token<State<string>>>().toMatchTypeOf<Token<State<any>>>();
    });

    it('state of string should be assignable to state of any using partial token', () => {
      expectTypeOf<Token<State<string>>>().toMatchTypeOf<
        PartialToken<State<any>>
      >();
    });

    it('read write token should be assignable to read only', () => {
      expectTypeOf<Token<State<string>>>().toMatchTypeOf<
        Token<State<string, never>>
      >();
    });

    it('single type state should be assignable to multi type', () => {
      expectTypeOf<Token<State<string>>>().toMatchTypeOf<
        Token<State<string | undefined>>
      >();
    });
  });
});

interface Person {
  name: string;
  parent?: Person;
  children?: Person[];
}
