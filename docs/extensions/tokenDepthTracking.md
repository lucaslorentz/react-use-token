# Extensions

## Token depth tracking

```ts
// Create symbols to store hidden data inside the token that only this extension is able to access
const _depth = Symbol('depth');

// Declare token feature
export interface Depth extends FeatureBase<'Depth', Depth> {
  payload: {
    // Declare payload data
    readonly [_depth]: number;
  };
  childFeatures: {
    // Declare child features
    [P in PropertyKey]: Depth;
  };
}

// Implement extension
export function trackDepth(): TokenExtension<NoFeature, Depth> {
  return {
    extend: {
      [_depth]: 0,
    },
    extendChildren: (_childToken, parentToken, _property) => {
      return {
        [_depth]: parentToken[_depth] + 1,
      };
    },
  };
}

// Expose functions to access token features
export function getTokenDepth(token: Token<Depth>) {
  return token[_depth];
}
```

Now you can use the trackDepth extension with any existing token:

```ts
const myToken = useStateToken<any>(null);
// typeof myToken = Token<State<any>>;

const myToken2 = useTokenExtension(myToken, () => trackDepth());
// typeof myToken2 = Token<State<any> & Depth>;

const depthRoot = getTokenDepth(myToken2);
// depthRoot = 0

const depthProperty = getTokenDepth(myToken2.a.b);
// depthProperty = 2

getTokenDepth(myToken); // Compilation error because myToken doesn't have depth feature
```
