import { act, renderHook } from '@testing-library/react-hooks';
import { useStateToken, useTokenSetter, useTokenValue } from './state';

describe('state', () => {
  describe('useStateToken', () => {
    const initialValue: Person = {
      name: 'John',
      children: [
        {
          name: 'Dorothy',
        },
      ],
    };

    it('should read and write state in immutably', () => {
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
      expect(result.current.name).toBe(initialValue.name);
      expect(result.current.children).toBe(initialValue.children);
      expect(result.current.children_0).toBe(initialValue.children![0]);
      expect(result.current.children_0_name).toBe(
        initialValue.children![0].name
      );

      act(() => result.current.children_0_name_setter('Changed name'));

      expect(result.current.root).not.toBe(initialValue);
      expect(result.current.name).toBe(initialValue.name);
      expect(result.current.children).not.toBe(initialValue.children);
      expect(result.current.children_0).not.toBe(initialValue.children![0]);
      expect(result.current.children_0_name).toBe('Changed name');
    });
  });
});

interface Person {
  name: string;
  parent?: Person;
  children?: Person[];
}
