# tinyspy

> minimal fork of nanospy, with more features 🕵🏻‍♂️

A `10KB` package for minimal and easy testing with no dependencies.
This package was created for having a tiny spy library to use in `vitest`, but it can also be used in `jest` and other test environments.

_In case you need more tiny libraries like tinypool or tinyspy, please consider submitting an [RFC](https://github.com/tinylibs/rfcs)_

## Installing

```bash
// with npm
$ npm install -D tinyspy

// with pnpm
$ pnpm install -D tinyspy

// with yarn
$ yarn install -D tinyspy
```

## Usage

### spy

Simplest usage would be:

```js
const fn = (n) => n + '!'
const spied = spy(fn)

spied('a')

console.log(spied.called) // true
console.log(spied.callCount) // 1
console.log(spied.calls) // [['a']]
console.log(spied.results) // [['ok', 'a!']]
console.log(spied.returns) // ['a!']
```

You can reset calls, returns, called and callCount with `reset` function:

```js
const spied = spy((n) => n + '!')

spied('a')

console.log(spied.called) // true
console.log(spied.callCount) // 1
console.log(spied.calls) // [['a']]
console.log(spied.returns) // ['a!']

spied.reset()

console.log(spied.called) // false
console.log(spied.callCount) // 0
console.log(spied.calls) // []
console.log(spied.returns) // []
```

Since 3.0, tinyspy doesn't unwrap the Promise in `returns` and `results` anymore, so you need to await it manually:

```js
const spied = spy(async (n) => n + '!')

const promise = spied('a')

console.log(spied.called) // true
console.log(spied.results) // [['ok', Promise<'a!'>]]

await promise

console.log(spied.results) // [['ok', Promise<'a!'>]]

console.log(await spied.returns[0]) // 'a!'
```

> [!WARNING]
> This also means the function that returned a Promise will always have result type `'ok'` even if the Promise rejected

Tinyspy 3.0 still exposes resolved values on `resolves` property:

```js
const spied = spy(async (n) => n + '!')

const promise = spied('a')

console.log(spied.called) // true
console.log(spied.resolves) // [] <- not resolved yet

await promise

console.log(spied.resolves) // [['ok', 'a!']]
```

### spyOn

> All `spy` methods are available on `spyOn`.

You can spy on an object's method or setter/getter with `spyOn` function.

```js
let apples = 0
const obj = {
  getApples: () => 13,
}

const spy = spyOn(obj, 'getApples', () => apples)
apples = 1

console.log(obj.getApples()) // prints 1

console.log(spy.called) // true
console.log(spy.returns) // [1]
```

```js
let apples = 0
let fakedApples = 0
const obj = {
  get apples() {
    return apples
  },
  set apples(count) {
    apples = count
  },
}

const spyGetter = spyOn(obj, { getter: 'apples' }, () => fakedApples)
const spySetter = spyOn(obj, { setter: 'apples' }, (count) => {
  fakedApples = count
})

obj.apples = 1

console.log(spySetter.called) // true
console.log(spySetter.calls) // [[1]]

console.log(obj.apples) // 1
console.log(fakedApples) // 1
console.log(apples) // 0

console.log(spyGetter.called) // true
console.log(spyGetter.returns) // [1]
```

You can reassign mocked function and restore mock to its original implementation with `restore` method:

```js
const obj = {
  fn: (n) => n + '!',
}
const spied = spyOn(obj, 'fn').willCall((n) => n + '.')

obj.fn('a')

console.log(spied.returns) // ['a.']

spied.restore()

obj.fn('a')

console.log(spied.returns) // ['a!']
```

You can even make an attribute into a dynamic getter!

```js
let apples = 0
const obj = {
  apples: 13,
}

const spy = spyOn(obj, { getter: 'apples' }, () => apples)

apples = 1

console.log(obj.apples) // prints 1
```

You can restore spied function to its original value with `restore` method:

```js
let apples = 0
const obj = {
  getApples: () => 13,
}

const spy = spyOn(obj, 'getApples', () => apples)

console.log(obj.getApples()) // 0

spy.restore()

console.log(obj.getApples()) // 13
```

## API

### `spy(fn?)`

Wraps `fn` and records every call. The wrapper forwards arguments, `this` and
`new.target`, so it can stand in for a plain function or a constructor.

```js
const spied = spy((n) => n + '!')

spied('a')

console.log(spied.callCount) // 1
console.log(spied.returns) // ['a!']
```

`fn` is optional. A spy created without one records calls and returns
`undefined`:

```js
const noop = spy()

noop('a')

console.log(noop.calls) // [['a']]
console.log(noop.returns) // [undefined]
```

Throws `cannot spy on a non-function value` if `fn` is neither a function nor
`undefined`.

### `spyOn(obj, accessor, mock?)`

Replaces a method, getter or setter on `obj` and records calls to it. Returns a
spy with everything `spy()` provides plus [`getOriginal`](#getoriginal),
[`willCall`](#willcallfn) and [`restore`](#restore).

`accessor` is either a property name, or `{ getter: name }` / `{ setter: name }`
to target an accessor:

```js
const obj = {
  getApples: () => 13,
}

const spied = spyOn(obj, 'getApples', () => 0)

console.log(obj.getApples()) // 0
console.log(spied.returns) // [0]
```

`mock` is optional — omit it to observe calls while keeping the original
behaviour:

```js
const spied = spyOn(obj, 'getApples')

console.log(obj.getApples()) // 13, unchanged
console.log(spied.called) // true
```

The property is looked up along the prototype chain, so inherited methods can be
spied on without touching the prototype itself. Every `spyOn` spy is added to
[`spies`](#spies), which is what makes [`restoreAll()`](#restoreall) able to find
it.

Throws if `obj` is `undefined` (`spyOn could not find an object to spy upon`), if
it is a primitive (`cannot spyOn on a primitive value`), if the property does not
exist (`<name> does not exist`), or if both `getter` and `setter` are given
(`cannot spy on both getter and setter`).

### `restoreAll()`

Restores every spy created by `spyOn` and empties [`spies`](#spies). Spies
created by `spy()` are unaffected, since they never replaced anything.

```js
const obj = { fn: () => 'original' }

spyOn(obj, 'fn', () => 'mocked')
console.log(obj.fn()) // 'mocked'

restoreAll()
console.log(obj.fn()) // 'original'
```

## Spy properties

Available on spies from both `spy()` and `spyOn()`.

| Property    | Type                          | Description                                                                                  |
| ----------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| `called`    | `boolean`                     | Whether the spy was called at least once.                                                    |
| `callCount` | `number`                      | How many times the spy was called.                                                           |
| `calls`     | `A[]`                         | The arguments of each call, in order.                                                        |
| `results`   | `['ok', R] \| ['error', any]` | The outcome of each call — `'ok'` with the return value, or `'error'` with the thrown value. |
| `resolves`  | `['ok', V] \| ['error', any]` | The settled outcome of each call that returned a Promise, filled in when it settles.         |
| `returns`   | `R[]`                         | The return value of each call — the second element of each `results` entry.                  |
| `length`    | `number`                      | The arity of the wrapped function, or `0` when there is none.                                |
| `impl`      | `function \| undefined`       | The function currently being called. Assignable.                                             |

```js
const spied = spy((n) => n + '!')

spied('a')

console.log(spied.called) // true
console.log(spied.callCount) // 1
console.log(spied.calls) // [['a']]
console.log(spied.results) // [['ok', 'a!']]
console.log(spied.returns) // ['a!']
```

A call that throws is recorded as an `'error'` result, and the error is
re-thrown:

```js
const spied = spy(() => {
  throw new Error('boom')
})

try {
  spied()
} catch {}

console.log(spied.results) // [['error', Error: boom]]
```

### `reset()`

Clears `called`, `callCount`, `calls`, `results`, `resolves` and any values
queued with `nextResult`/`nextError`. It does not restore a `spyOn` spy — use
[`restore()`](#restore) for that.

```js
spied.reset()

console.log(spied.called) // false
console.log(spied.callCount) // 0
console.log(spied.calls) // []
```

### `nextResult(value)`

Queues `value` to be returned by the next call instead of invoking the
implementation. The queue is FIFO and each entry is consumed once, after which
calls fall back to the implementation:

```js
const spied = spy(() => 'real')

spied.nextResult('first')
spied.nextResult('second')

console.log(spied()) // 'first'
console.log(spied()) // 'second'
console.log(spied()) // 'real'
```

### `nextError(error)`

Queues `error` to be thrown by the next call. Shares the queue with
`nextResult`, and is likewise consumed once:

```js
const spied = spy(() => 'real')

spied.nextError(new Error('boom'))

try {
  spied() // throws Error: boom
} catch {}

console.log(spied()) // 'real'
console.log(spied.results) // [['error', Error: boom], ['ok', 'real']]
```

## `spyOn` methods

Only available on spies created by `spyOn`.

### `getOriginal()`

Returns the function that was replaced, without restoring it.

```js
const obj = { fn: () => 'original' }
const spied = spyOn(obj, 'fn', () => 'mocked')

console.log(spied.getOriginal()()) // 'original'
console.log(obj.fn()) // 'mocked', still spied
```

### `willCall(fn)`

Swaps the implementation the spy delegates to and returns the spy, so it can be
chained onto `spyOn`. Recorded calls are kept.

```js
const obj = { fn: (n) => n + '!' }
const spied = spyOn(obj, 'fn').willCall((n) => n + '.')

console.log(obj.fn('a')) // 'a.'
```

### `restore()`

Puts the original property back. Calls recorded so far remain readable on the
spy.

```js
spied.restore()

console.log(obj.fn('a')) // 'a!'
```

Spies are also disposable where `Symbol.dispose` exists, which restores them at
the end of the block:

```js
{
  using spied = spyOn(obj, 'fn', () => 'mocked')
  console.log(obj.fn()) // 'mocked'
}

console.log(obj.fn()) // 'original'
```

## Internal API

Exported for tools building on top of tinyspy, such as `vitest`. Most users want
`spy` and `spyOn` instead.

### `spies`

A `Set` of every spy created by `spyOn` that has not been restored.
[`restoreAll()`](#restoreall) iterates it. Spies from `spy()` are not added.

### `createInternalSpy(fn?)`

The call-recording wrapper behind `spy()`, without the public properties —
`returns`, `nextResult`, `nextError` and the rest are not defined on it. Its
recorded state is reachable through [`getInternalState`](#getinternalstatespy).

### `internalSpyOn(obj, accessor, mock?)`

The property-replacing half of `spyOn()`, again without the public properties.
`restore`, `getOriginal` and `willCall` live on its internal state rather than on
the spy itself.

### `getInternalState(spy)`

Returns the state object backing a spy — the same `called`, `callCount`, `calls`,
`results` and `resolves` the public properties read from. Useful for spies built
with `createInternalSpy` or `internalSpyOn`, which do not expose them directly.

```js
const internal = createInternalSpy((n) => n)

internal(5)

console.log('returns' in internal) // false
console.log(getInternalState(internal).callCount) // 1
console.log(getInternalState(internal).calls) // [[5]]
```

## Authors

| <a href="https://github.com/Aslemammad"> <img width='150' src="https://avatars.githubusercontent.com/u/37929992?v=4" /><br> Mohammad Bagher </a> | <a href="https://github.com/sheremet-va"> <img width='150' src="https://avatars.githubusercontent.com/u/16173870?v=4" /><br> Vladimir </a> |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |

## Sponsors

Your sponsorship can make a huge difference in continuing our work in open source!

### Vladimir sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sheremet-va/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sheremet-va/static/sponsors.svg'/>
  </a>
</p>

### Mohammad sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/aslemammad/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/aslemammad/static/sponsors.svg'/>
  </a>
</p>
