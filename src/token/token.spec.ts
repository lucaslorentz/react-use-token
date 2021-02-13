import { renderHook } from '@testing-library/react-hooks';
import { expectTypeOf } from 'expect-type';
import {
  ChildFeatures,
  ChildProperties,
  CleanupFeatures,
  FeatureMetadata,
  GetIdentifiers,
  NoFeature,
  Token,
  TokenExtension,
  useToken,
  _metadata,
} from './token';

const _dataA = Symbol('dataA');
const _dataB = Symbol('dataB');

describe('token', () => {
  describe('without extension', () => {
    const { result } = renderHook(() => useToken());
    const token = result.current;

    it('returns token without features', () => {
      expect(token).toBeDefined();
      expectTypeOf(token).toEqualTypeOf<Token<NoFeature>>();
    });

    it('no child tokens are available', () => {
      // @ts-expect-error
      expect(token.test).toBeDefined();
    });
  });

  describe('with extension', () => {
    const { result } = renderHook(() => useToken(() => addFeatureA('secret')));
    const token = result.current;

    it('returns token with feature', () => {
      expect(token).toBeDefined();
      expect(getFeatureAValue(token)).toBe('secret');
      expectTypeOf(token).toEqualTypeOf<Token<FeatureA>>();
    });

    it('propagate feature to child tokens', () => {
      expect(getFeatureAValue(token.a)).toBe('secret');
      expectTypeOf(token.a).toEqualTypeOf<Token<FeatureA>>();

      expect(getFeatureAValue(token.common)).toBe('secret');
      expectTypeOf(token.common).toEqualTypeOf<Token<FeatureA>>();
    });

    it("doesn't allow non defined child tokens", () => {
      // @ts-expect-error
      expect(token.other).toBeDefined();
    });
  });

  describe('types', () => {
    describe('single feature', () => {
      it('find identifiers', () => {
        type result = GetIdentifiers<FeatureA>;
        expectTypeOf<result>().toEqualTypeOf<'featureA'>();
      });

      it('find child properties', () => {
        type result = ChildProperties<FeatureA>;
        expectTypeOf<result>().toEqualTypeOf<'a' | 'common'>();
      });

      it('find child features', () => {
        type result = ChildFeatures<FeatureA, 'a'>;
        expectTypeOf<result>().toEqualTypeOf<FeatureA>();
      });

      it('cleans up base features', () => {
        type result = CleanupFeatures<NoFeature & FeatureA>;
        expectTypeOf<result>().toEqualTypeOf<FeatureA>();
      });
    });

    describe('multi feature', () => {
      it('find identifiers', () => {
        type result = GetIdentifiers<FeatureA & FeatureB>;
        expectTypeOf<result>().toEqualTypeOf<'featureA' | 'featureB'>();
      });

      it('find all child properties', () => {
        type result = ChildProperties<FeatureA & FeatureB>;
        expectTypeOf<result>().toEqualTypeOf<'a' | 'b' | 'common'>();
      });

      it('find first child feature', () => {
        type result = ChildFeatures<FeatureA & FeatureB, 'a'>;
        expectTypeOf<result>().toEqualTypeOf<FeatureA>();
      });

      it('find second child feature', () => {
        type result = ChildFeatures<FeatureA & FeatureB, 'b'>;
        expectTypeOf<result>().toEqualTypeOf<FeatureB>();
      });

      it('find both child features', () => {
        type result = ChildFeatures<FeatureA & FeatureB, 'common'>;
        expectTypeOf<result>().toEqualTypeOf<FeatureA & FeatureB>();
      });

      it('cleans up base features', () => {
        type result = CleanupFeatures<NoFeature & FeatureA & FeatureB>;
        expectTypeOf<result>().toEqualTypeOf<FeatureA & FeatureB>();
      });

      it('is assignable to single features', () => {
        type combinedToken = Token<FeatureA & FeatureB>;
        expectTypeOf<combinedToken>().toMatchTypeOf<Token<FeatureA>>();
        expectTypeOf<combinedToken>().toMatchTypeOf<Token<FeatureB>>();
        expectTypeOf<combinedToken>().toMatchTypeOf<FeatureA>();
        expectTypeOf<combinedToken>().toMatchTypeOf<FeatureB>();
      });
    });

    describe('feature inheritance', () => {
      it('find identifiers', () => {
        type result = GetIdentifiers<FeatureA2>;
        expectTypeOf<result>().toEqualTypeOf<'featureA' | 'featureA2'>();
      });

      it('find child properties', () => {
        type result = ChildProperties<FeatureA2>;
        expectTypeOf<result>().toEqualTypeOf<'a' | 'common'>();
      });

      it('find child features', () => {
        type result = ChildFeatures<FeatureA2, 'a'>;
        expectTypeOf<result>().toEqualTypeOf<FeatureA2>();
      });

      it('cleans up base features', () => {
        type result = CleanupFeatures<NoFeature & FeatureA & FeatureA2>;
        expectTypeOf<result>().toEqualTypeOf<FeatureA2>();
      });

      it('is assignable to base features', () => {
        expectTypeOf<Token<FeatureA2>>().toMatchTypeOf<Token<FeatureA>>();
        expectTypeOf<Token<FeatureA2>>().toMatchTypeOf<FeatureA>();
      });
    });
  });
});

interface FeatureA {
  [_dataA]: string;
  [_metadata]?: FeatureMetadata<
    'featureA',
    FeatureA,
    NoFeature,
    { a: FeatureA; common: FeatureA }
  >;
}
function addFeatureA(value: string): TokenExtension<NoFeature, FeatureA> {
  debugger;
  return {
    extend: {
      [_dataA]: value,
    },
    extendChildren: true,
  };
}
function getFeatureAValue(token: FeatureA) {
  return token[_dataA];
}
interface FeatureA2 extends FeatureA {
  [_metadata]?: FeatureMetadata<
    'featureA2',
    FeatureA2,
    FeatureA,
    { a: FeatureA2; common: FeatureA2 }
  >;
}
interface FeatureB {
  [_dataB]: string;
  [_metadata]?: FeatureMetadata<
    'featureB',
    FeatureB,
    NoFeature,
    { b: FeatureB; common: FeatureB }
  >;
}
