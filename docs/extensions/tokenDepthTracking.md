# Extensions

## Token depth tracking extension

Token depth tracking extension:

```ts
// Create symbols to store hidden data inside the token that only this extension is able to access
const _depth = Symbol('depth');

// Declare token feature
export interface Depth {
  // Declare hidden fields
  [_depth]: number;

  // Declare child features
  [_childFeatures]?: DeclareChildFeatures<
    NoFeature, // Features to omit/override
    'depth', // Unique identifier
    { [P in PropertyKey]: Depth } // Map with all possible child properties and it's feature
  >;
}

// Implement extension
export function trackDepth(): TokenExtension<NoFeature, Depth> {
  return {
    extend: {
      [_depth]: 0,
    },
    extendChildren: (childToken, parentToken, property) => {
      return {
        [_depth]: parentToken[_depth] + 1,
      };
    },
  };
}

// Expose functions to access token features
export function getTokenDepth(token: Depth) {
  return token[_depth];
}
```

Now you can use the trackDepth extension with any existing token:

```ts
const myToken = useStateToken<MyState>();
// typeof myToken = Token<State<MyState>>;

const myToken2 = useTokenExtension(myToken, () => trackDepth());
// typeof myToken2 = Token<State<MyState> & Depth>;

const depthRoot = getTokenDepth(myToken2);
// depthRoot = 0

const depthProperty = getTokenDepth(myToken2.a.b);
// depthProperty = 2

getTokenDepth(myToken); // Compilation error because myToken doesn't have depth feature
```
