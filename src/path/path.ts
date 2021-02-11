import {
  DeclareChildFeatures,
  NoFeature,
  TokenExtension,
  _childFeatures,
} from '../token';

const _path = Symbol('path');

export interface Path<TState = any> {
  readonly [_path]: string;
  [_childFeatures]?: DeclareChildFeatures<
    NoFeature,
    'path',
    {
      [P in keyof NonNullable<TState>]-?: Path<NonNullable<TState>[P]>;
    }
  >;
}

export function addPath<TState = any>(
  initialPath: string = ''
): TokenExtension<NoFeature, Path<TState>> {
  return {
    extend: {
      [_path]: initialPath,
    },
    extendChildren: (_, parent, property) => {
      const childPath = parent[_path]
        ? `${parent[_path]}.${String(property)}`
        : String(property);

      return {
        [_path]: childPath,
      };
    },
  };
}

export function getTokenPath(token: Path<any>): string {
  return token[_path];
}
