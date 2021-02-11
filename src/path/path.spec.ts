import { createToken } from '../token';
import { addPath, getTokenPath } from './path';

describe('path', () => {
  it('should track token path with dot notation', () => {
    const pathToken = createToken(addPath());
    expect(getTokenPath(pathToken)).toBe('');
    expect(getTokenPath(pathToken.children)).toBe('children');
    expect(getTokenPath(pathToken.children[0])).toBe('children.0');
    expect(getTokenPath(pathToken.children[0].name)).toBe('children.0.name');
  });
});
