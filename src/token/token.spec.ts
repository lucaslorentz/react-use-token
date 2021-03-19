import { renderHook } from '@testing-library/react-hooks';
import { expectTypeOf } from 'expect-type';
import { PartialToken, Token, useToken } from '.';
import { FeatureBase, NoFeature } from './feature';
import { TokenExtension } from './token';

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
    const { result } = renderHook(() =>
      useToken(b => b.extend(addFeatureA('secret')))
    );
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
      it('not match features without token', () => {
        type result = Token<FeatureA>;
        expectTypeOf<result>().not.toMatchTypeOf<FeatureA>();
      });

      it('have child tokens', () => {
        type result = Omit<Token<FeatureA>, symbol>;
        expectTypeOf<result>().toEqualTypeOf<{
          readonly a: Token<FeatureA>;
          readonly common: Token<FeatureA>;
        }>();
      });
    });

    describe('multi feature', () => {
      it('not match features without token', () => {
        type result = Token<FeatureA & FeatureB>;
        expectTypeOf<result>().not.toMatchTypeOf<FeatureA & FeatureB>();
      });

      it('have right child tokens', () => {
        type result = Omit<Token<FeatureA & FeatureB>, symbol>;
        expectTypeOf<result>().toEqualTypeOf<{
          readonly a: Token<FeatureA>;
          readonly b: Token<FeatureB>;
          readonly common: Token<FeatureA & FeatureB>;
        }>();
      });

      it('is assignable to single features', () => {
        type combinedToken = Token<FeatureA & FeatureB>;
        expectTypeOf<combinedToken>().toMatchTypeOf<Token<FeatureA>>();
        expectTypeOf<combinedToken>().toMatchTypeOf<Token<FeatureB>>();
        expectTypeOf<combinedToken>().toMatchTypeOf<PartialToken<FeatureA>>();
        expectTypeOf<combinedToken>().toMatchTypeOf<PartialToken<FeatureB>>();
      });
    });

    describe('feature inheritance', () => {
      it('not match features without token', () => {
        type result = Token<FeatureA2>;
        expectTypeOf<result>().not.toMatchTypeOf<FeatureA2>();
      });

      it('have right child tokens', () => {
        type result = Omit<Token<FeatureA2>, symbol>;
        expectTypeOf<result>().toEqualTypeOf<{
          readonly a: Token<FeatureA2>;
          readonly common: Token<FeatureA2>;
        }>();
      });

      it('is assignable to base features', () => {
        expectTypeOf<Token<FeatureA2>>().toMatchTypeOf<Token<FeatureA>>();
        expectTypeOf<Token<FeatureA2>>().toMatchTypeOf<
          PartialToken<FeatureA>
        >();
      });
    });

    describe('feature group', () => {
      it('not match features without token', () => {
        type result = Token<FeatureAB>;
        expectTypeOf<result>().not.toMatchTypeOf<FeatureAB>();
        expectTypeOf<result>().not.toMatchTypeOf<FeatureA & FeatureB>();
      });

      it('have right child tokens', () => {
        type result = Omit<Token<FeatureAB>, symbol>;
        expectTypeOf<result>().toEqualTypeOf<{
          readonly a: Token<FeatureA>;
          readonly b: Token<FeatureB>;
          readonly common: Token<FeatureAB>;
        }>();
      });

      it('is assignable to base features', () => {
        expectTypeOf<Token<FeatureAB>>().toMatchTypeOf<Token<FeatureA>>();
        expectTypeOf<Token<FeatureAB>>().toMatchTypeOf<
          PartialToken<FeatureA>
        >();
      });

      it('is assignable from base features', () => {
        expectTypeOf<Token<FeatureA & FeatureB>>().toMatchTypeOf<
          Token<FeatureAB>
        >();
        expectTypeOf<Token<FeatureA & FeatureB>>().toMatchTypeOf<
          PartialToken<FeatureAB>
        >();
      });
    });
  });
});

interface FeatureA extends FeatureBase<'FeatureA', FeatureA> {
  payload: {
    [_dataA]: string;
  };
  childFeatures: { a: FeatureA; common: FeatureA };
}
function addFeatureA(
  value: string
): TokenExtension<NoFeature, { add: FeatureA }> {
  return builder =>
    builder.addFeature<FeatureA>({
      extend: {
        [_dataA]: value,
      },
      extendChildren: true,
    });
}
function getFeatureAValue(token: PartialToken<FeatureA>) {
  return token[_dataA];
}
interface FeatureA2 extends FeatureBase<'FeatureA2', FeatureA2> {
  payload: FeatureA['payload'];
  baseFeatures: FeatureA;
  childFeatures: { a: FeatureA2; common: FeatureA2 };
}
interface FeatureB extends FeatureBase<'FeatureB', FeatureB> {
  payload: {
    [_dataB]: string;
  };
  childFeatures: { b: FeatureB; common: FeatureB };
}
interface FeatureAB extends FeatureBase<'FeatureAB', FeatureAB> {
  payload: FeatureA['payload'] & FeatureB['payload'];
  childFeatures: FeatureA['childFeatures'] &
    FeatureB['childFeatures'] & { common: FeatureAB };
}
