import { expectTypeOf } from 'expect-type';
import { Token, TokenBuilder } from '../token';
import { addPath, getTokenPath, Path } from './path';

describe('path', () => {
  it('should track token path', () => {
    const pathToken = new TokenBuilder().extend(addPath()).build();

    expect(getTokenPath(pathToken)).toBe('');
    expectTypeOf(pathToken).toEqualTypeOf<Token<Path>>();

    expect(getTokenPath(pathToken.a)).toBe('a');
    expectTypeOf(pathToken.a).toEqualTypeOf<Token<Path>>();

    expect(getTokenPath(pathToken.a.b)).toBe('a.b');
    expectTypeOf(pathToken.a.b).toEqualTypeOf<Token<Path>>();

    expect(getTokenPath(pathToken[0])).toBe('[0]');
    expectTypeOf(pathToken[0]).toEqualTypeOf<Token<Path>>();

    expect(getTokenPath(pathToken[0][1])).toBe('[0][1]');
    expectTypeOf(pathToken[0][1]).toEqualTypeOf<Token<Path>>();

    expect(getTokenPath(pathToken.a[0].b[0])).toBe('a[0].b[0]');
    expectTypeOf(pathToken.a[0].b[0]).toEqualTypeOf<Token<Path>>();
  });
});
