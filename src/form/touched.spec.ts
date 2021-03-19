import { act, renderHook } from '@testing-library/react-hooks';
import { expectTypeOf } from 'expect-type';
import { addPath } from '../path';
import { addState, useStateToken } from '../state';
import { TokenBuilder, useTokenExtension } from '../token';
import {
  addTouched,
  setTokenTouched,
  TouchedFieldsState,
  useTokenTouched,
} from './touched';

describe('touched', () => {
  it('should propagate touched fields', () => {
    const initialValue: Person = {
      name: 'John',
      children: [
        {
          name: 'Dorothy',
        },
      ],
    };

    const touchedFieldsToken = new TokenBuilder()
      .extend(addPath())
      .extend(addState<TouchedFieldsState>({}))
      .build();

    const { result: useStateTokenResult } = renderHook(() => {
      const token = useStateToken(initialValue);
      return useTokenExtension(token, b =>
        b.extend(addTouched({ touchedFieldsToken }))
      );
    });

    const token = useStateTokenResult.current;

    const { result } = renderHook(() => {
      return {
        root: useTokenTouched(token),
        name: useTokenTouched(token.name),
        children: useTokenTouched(token.children),
        children_0: useTokenTouched(token.children[0]),
        children_0_name: useTokenTouched(token.children[0].name),
      };
    });

    expect(result.current.root).toBe(false);
    expect(result.current.name).toBe(false);
    expect(result.current.children).toBe(false);
    expect(result.current.children_0).toBe(false);
    expect(result.current.children_0_name).toBe(false);

    expectTypeOf(result.current.name).toEqualTypeOf<boolean>();

    act(() => setTokenTouched(token.name, true));

    expect(result.current.root).toBe(false);
    expect(result.current.name).toBe(true);
    expect(result.current.children).toBe(false);
    expect(result.current.children_0).toBe(false);
    expect(result.current.children_0_name).toBe(false);
  });
});

interface Person {
  name: string;
  parent?: Person;
  children?: Person[];
}
