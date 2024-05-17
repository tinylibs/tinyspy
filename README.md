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

Since 3.0, tinyspy doesn't unwrap the Promise in `returns` anymore, so you need to await it manually:

```js
const spied = spy(async (n) => n + '!')

const promise = spied('a')

console.log(spied.called) // true
console.log(spied.returns) // ['ok', Promise<'a!'>]

await promise

console.log(spied.returns) // ['ok', Promise<'a!'>]

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

console.log(spied.resolves) // ['ok', 'a!']
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

obj.restore()

console.log(obj.getApples()) // 13
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
