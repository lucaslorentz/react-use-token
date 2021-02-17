import { act, renderHook } from '@testing-library/react-hooks';
import { expectTypeOf } from 'expect-type';
import { PartialToken, Token } from '../token';
import {
  ReadState,
  useStateToken,
  useTokenSetter,
  useTokenValue,
  WriteState,
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

  describe('types', () => {
    it('token should not be assignable to pure feature', () => {
      expectTypeOf<Token<ReadState<string>>>().not.toMatchTypeOf<
        ReadState<string>
      >();
    });

    it('state of any should not assignable to states of string', () => {
      expectTypeOf<Token<ReadState<any>>>().not.toMatchTypeOf<
        Token<ReadState<string>>
      >();
    });

    it('state of any should be assignable state of string using partial token', () => {
      expectTypeOf<Token<ReadState<any>>>().toMatchTypeOf<
        PartialToken<ReadState<string>>
      >();
    });

    it('state of string should should be assignable to state of any', () => {
      expectTypeOf<Token<ReadState<string>>>().not.toMatchTypeOf<
        Token<ReadState<any>>
      >();
    });

    it('state of string should should be assignable to state of any using partial token', () => {
      expectTypeOf<Token<ReadState<string>>>().toMatchTypeOf<
        PartialToken<ReadState<any>>
      >();
    });

    it('read write token should be assignable to read', () => {
      expectTypeOf<
        Token<ReadState<string> & WriteState<string>>
      >().toMatchTypeOf<Token<ReadState<string>>>();
    });

    it('single type state should be assignable to multi type', () => {
      expectTypeOf<Token<ReadState<string>>>().toMatchTypeOf<
        Token<ReadState<string | undefined>>
      >();
    });
  });
});

interface Person {
  name: string;
  parent?: Person;
  children?: Person[];
}
