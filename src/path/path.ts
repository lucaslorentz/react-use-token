import {
  FeatureMetadata,
  NoFeature,
  TokenExtension,
  _metadata,
  PartialToken,
} from '../token';

const _path = Symbol('path');

export interface Path {
  readonly [_path]: string;
  [_metadata]: FeatureMetadata<
    'path',
    Path,
    NoFeature,
    {
      [P in PropertyKey]: Path;
    }
  >;
}

export function addPath(
  initialPath: string = ''
): TokenExtension<NoFeature, Path> {
  return {
    extend: {
      [_path]: initialPath,
    },
    extendChildren: (_, parent, property) => {
      let childPath;

      if (typeof property === 'number') {
        childPath = `${parent[_path]}[${String(property)}]`;
      } else {
        childPath = parent[_path]
          ? `${parent[_path]}.${String(property)}`
          : String(property);
      }

      return {
        [_path]: childPath,
      };
    },
  };
}

export function getTokenPath(token: PartialToken<Path>): string {
  return token[_path];
}
