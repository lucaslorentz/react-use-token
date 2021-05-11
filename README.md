# react-use-token - Experimental

Token based state management for react:

- Simple react hooks API
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

## Problem

React state hooks problems:

- It couples the component that invokes the hook to the state, re-rendering it every time the state changes
- Lot of boilerplate code to delegate part of the state to other components

[View in code sandbox](https://codesandbox.io/s/cat-vs-dog-react-u92ot?file=/src/App.tsx)

## Solution

- Use tokens to decouple the creation of state from it's usage
- Allow tokens to be decomposed into child tokens to delegate part of the state
- Strongly type tokens so you know what's the type of the state the token represents

[View in code sandbox](https://codesandbox.io/s/cat-vs-dog-react-use-token-jdjs9?file=/src/App.tsx). Only required components re-render, and it's much simpler to delegate part of the state to other componentes.

## State tokens API

Create a state token:

```ts
const stateToken = useStateToken({ firstName: '', lastName: '' });
// typeof stateToken: Token<State<{ firstName: string, lastName: string }>>
```

Create state token from value initializer.:

```ts
const stateToken = useStateToken(() => ({ firstName: '', lastName: '' }));
// typeof stateToken: Token<State<{ firstName: string, lastName: string }>>
```

Decompose state token:

```ts
const firsNameToken = stateToken.firstName;
// typeof firsNameToken: Token<State<string>>
```

Redeem token value:

```ts
const value = useTokenValue(stateToken.firstName);
// typeof value: string
```

Redeem token setter:

```ts
const setValue = useTokenSetter(stateToken.firstName);
// typeof setValue: (v: string) => void
setValue(10);
```

Redeem token state (value + setter):

```ts
const [value, setValue] = useTokenState(stateToken.firstName);
```

Get value without hooks (use it inside effects or callbacks):

```ts
const value = getTokenValue(stateToken.firstName);
// typeof value: string
```

Set value without hooks (use it anywhere):

```ts
setTokenValue(stateToken.firstName, 10);
```

Tokens are just a definition of how to get and set state, they can outlive the state value:

```ts
const token = useStateToken<any>(null);
useEffect(() => {
  setTokenValue(token.user.preferences.languages[0], "EN");
  // token value: { user: { preferences: { languages: ["EN"] } } }
, []);
```

## Form tokens API

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

[View in code sandbox](https://codesandbox.io/s/react-use-tokenform-example-9k9rk?file=/src/App.tsx)

**All state tokens hooks/functions are also available in form tokens.**

Redeem schema information:

```ts
const { label, required } = useTokenSchemaInfo(formToken.firstName); // label: First name, required: true
```

Redeem validation error:

```ts
const error = useTokenErrorMessage(formToken.firstName); // Returns: Name is required
```

Redeem validation status:

```ts
const validationStatus = useTokenValidationStatus(formToken); // Type: 'pending' | 'validating' | 'invalid' | 'valid'
```

## Types guide

A decomposable token is represented with type `Token<Feature1 & Feature2...>`. It has all possible child tokens exposed as fields. Example:

```ts
function (token: Token<Feature1 & Feature2>) {
  var childToken = token.child;
}
```

Tokens with `any` types have less child tokens available, making them not assignable to a more specific token type. Example: `Token<ReadState<any>>` is not assignable to `Token<ReadState<string>>`.

If you want to support `any` types, you can use `PartialToken<Feature1 & Feature2...>`, which is a more compatible token that doesn't have child token fields. You can convert `PartialToken<Features>` to `Token<Features>` by calling method `restoreToken(partialToken)`. Example:

```ts
function (partialToken: PartialToken<Feature1 & Feature2>) {
  var token = restoreToken(token);
}
```

Feature types:

<!-- prettier-ignore -->
| Type | Description |
| ---- | ----------- |
| `ReadState<TState>` | Read state of type TState |
| `WriteState<TState>` | Write state of type TState |
| `State<TReadState, TWriteState>` | Alias to `ReadState<TReadState>` & `WriteState<TWriteState>` |
| `State<TState>` | Alias to `State<TState, TState>` |
| `Path` | Retrieve token path |
| `Schema` | Retrieve token schema info |
| `ErrorMessage` | Retrieve token validation error message |
| `ValidationStatus` | Retrieve token validation status |
| `Validated` | Alias to `Path` & `ErrorMessage` & `ValidationStatus` |
| `FormState<TReadState, TWriteState>` | Alias to `State<TReadState, TWriteState>` & `Validated<TReadState>` & `Schema<TReadState>` |
| `FormState<TState>` | Alias to `FormState<TState, TState>` |

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
- [error-message](./src/form/error-message.ts)
- [schema](./src/form/schema.ts)
- [validation](./src/form/validation.ts)
- [form](./src/form/form.ts)

Custom extensions examples:

- [Token depth tracking](./docs/extensions/tokenDepthTracking.md)
