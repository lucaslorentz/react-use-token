import { renderHook } from '@testing-library/react-hooks';
import {
  DeclareChildFeatures,
  NoFeature,
  TokenExtension,
  useToken,
  _childFeatures,
} from './token';

describe('token', () => {
  describe('useToken', () => {
    describe('without extension', () => {
      it('returns token', () => {
        const { result } = renderHook(() => useToken());
        const token = result.current;
        expect(token).toBeDefined();
      });
    });

    describe('with extension', () => {
      it('should extend token and children', () => {
        const { result } = renderHook(() => useToken(() => testExtension()));
        const token = result.current;
        expect(token).toBeDefined();
        expect(token[_isExtended]).toBe(true);
        expect(token.child[_isExtended]).toBe(true);
        expect(token.child[0][_isExtended]).toBe(true);
        expect(token.child[0].test[_isExtended]).toBe(true);
      });
    });
  });
});

const _isExtended = Symbol('test');
interface TestFeature {
  [_isExtended]: true;
  [_childFeatures]?: DeclareChildFeatures<
    NoFeature,
    'test',
    {
      [P in PropertyKey]: TestFeature;
    }
  >;
}
function testExtension(): TokenExtension<NoFeature, TestFeature> {
  return {
    extend: {
      [_isExtended]: true,
    },
    extendChildren: true,
  };
}
