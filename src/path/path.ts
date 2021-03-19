import { FeatureBase, NoFeature, PartialToken, TokenExtension } from '../token';

const _path = Symbol('path');

export interface Path extends FeatureBase<'Path', Path> {
  payload: {
    readonly [_path]: string;
  };
  childFeatures: {
    [P in PropertyKey]: Path;
  };
}

export function addPath(
  initialPath: string = ''
): TokenExtension<NoFeature, { add: Path }> {
  return tokenBuilder =>
    tokenBuilder.addFeature<Path>({
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
    });
}

export function getTokenPath(token: PartialToken<Path>): string {
  return token[_path];
}
