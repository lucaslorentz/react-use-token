# react-use-token

Enhanced react state hooks.

Goals:

- Simple API focused on react hooks
- Easy delegation of part of state to other components
- Granular state observability, only re-renders affected components
- Immutable state
- Extensible
- Strongly typed :heart: Typescript

## Installation

```sh
# npm
npm install react-use-token

# yarn
yarn add react-use-token
```

## Tokens

> _A token is an opaque object returned by a hook,_  
> _which can be decomposed into child tokens,_  
> _and can be used to redeem hook functionality._

It's much simpler to understand with code:

```ts
const LoginForm = () => {
  // Create a state token
  const loginToken = useStateToken(() => ({
    username: '',
    password: ''
  }));

  const handleLogin = useCallback(() => {
    console.log(getTokenValue(loginToken));
  }, [loginToken]);

  return (
    <div>
      { /* Decompose token into child tokens */ }
      <TextField token={loginToken.username} />
      <TextField token={loginToken.password} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

const TextField = ({ token }: { token: Token<State<string>> }) => {
  // Redeem state from token
  const [value, setValue] = useTokenState(token);

  // Manipulate state as usual
  ...
};
```

## State token

Create state token from value:

```ts
const stateToken = useStateToken(42);
```

Create state token from value initializer.:

```ts
const stateToken = useStateToken(() => 42);
```

Redeem token value:

```ts
const value = useTokenValue(stateToken);
```

Redeem token setter:

```ts
const setValue = useTokenSetter(stateToken);

setValue(10);
```

Redeem token state (value + setter):

```ts
const [value, setValue] = useTokenState(stateToken);
```

Get value without hooks (use it inside effects or callbacks):

```ts
const value = getTokenValue(stateToken);
```

Set value without hooks (use it anywhere):

```ts
setTokenValue(stateToken, 10);
```

## Form token

Form tokens extends state tokens with validation and useful metadata to build forms.

Form tokens are tightly integrated with Yup schemas.

Usage:

```ts
// Declare form schema using yup
const schema = object({
  firstName: string().label("First name").required(),
  lastName: string().label("Last name").required()
});
...
// Create form token
const formToken = useFormToken({ schema });
...
// Delegate part of state to other components
<TextField token={formToken.firstName} />
<TextField token={formToken.lastName} />
```
[View full example](https://codesandbox.io/s/react-use-tokenform-example-9k9rk?file=/src/App.tsx)

**All state tokens hooks/functions are also available in form tokens.** 

Redeem schema information:

```ts
const { label, required } = useTokenSchemaInfo(formToken.firstName); // label: First name, required: true
```

Redeem validation error:

```ts
const error = useTokenError(formToken.firstName); // First name is required
```

Redeem validation status:

```ts
const validationStatus = useTokenValidationStatus(formToken); // 'pending' | 'validating' | 'invalid' | 'valid'
```

## Type system

A decomposable token is represented with type `Token<Features>`. Example:

```ts
token: Token<ReadState<string>>
```

Multiple features should be combined with typescript intersection type. Example:

```ts
token: Token<ReadState<string> & WriteState<string>>
```

Whenever you need the token features but doesn't need to extend or decompose the token, you can omit the `Token<>` and use the feature types directly. Example:

```ts
token: ReadState<string> & WriteState<String>
```

Keep in mind that `Token<ReadState<string>>` is assignable to `ReadState<string>`, but not vice versa.

Feature types:

| Type | Description | Extends |
| ---- | ----------- | --- |
| `ReadState<TState>` | Read state | - |
| `WriteState<TState>` | Write state | - |
| `State<TReadState, TWriteState>` | Read and write state | `ReadState<TReadState>`<br />`WriteState<TWriteState>` |
| `State<TState>` | Same as `State<TState, TState>` | - |
| `Path<TState>` | Retrieve token path with dot notation | - |
| `Schema<TState>` | Retrieve token schema info | - |
| `Error<TState>` | Retrieve token validation errors | - |
| `Validated<TState>` | Retrieve validation status | `Error<TState>` |
| `FormState<TReadState, TWriteState>` | Form features | `State<TReadState, TWriteState>`<br />`Validated<TReadState>`<br />`Schema<TReadState>` |
| `FormState<TState>` | Same as `FormState<TState, TState>` | - |


## Extensibility

All features from this library are built as composable token extensions.

Instead of using the friendly `useStateToken` or `useFormToken` hooks, you could build a token with the same features using the token extensibility API:

```ts
const token = useToken();

const tokenWithState = useTokenExtension(token, () => addState<MyState>({}));

const formToken = useTokenExtension(tokenWithState, () => addForm({ schema }));
```

Learn how to create your own extensions by reading our source code:

- [path](./src/path/path.ts)
- [state](./src/state/state.ts)
- [error](./src/form/error.ts)
- [schema](./src/form/schema.ts)
- [validation](./src/form/validation.ts)
- [form](./src/form/form.ts)

Custom extensions examples:

- [Token depth tracking](./docs/extensions/tokenDepthTracking.md)
