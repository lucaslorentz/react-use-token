import { createToken } from '../token';
import { addPath, getTokenPath } from './path';

describe('path', () => {
  it('should track token path', () => {
    const pathToken = createToken(addPath());
    expect(getTokenPath(pathToken)).toBe('');
    expect(getTokenPath(pathToken.a)).toBe('a');
    expect(getTokenPath(pathToken.a.b)).toBe('a.b');
    expect(getTokenPath(pathToken[0])).toBe('[0]');
    expect(getTokenPath(pathToken[0][1])).toBe('[0][1]');
    expect(getTokenPath(pathToken.a[0].b[0])).toBe('a[0].b[0]');
  });
});
