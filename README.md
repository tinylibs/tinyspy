# tinyspy

> minimal fork of nanospy, with more features 🕵🏻‍♂️

A `4KB` package for minimal and easy testing with no dependencies.
This package was created for having a tiny spy library to use in `vitest`, but it can also be used in `jest` and other test environments.

## Installing

```
// with npm
npm install -D tinyspy

// with pnpm
pnpm install -D tinyspy

// with yarn
yarn install -D tinyspy
```

## Usage

> Warning! Does not support ESM mocking. You can use `tinyspy` with `vitest`, who performs additional transformations to make ESM mocking work.

### spy

Simplest usage would be:

```ts
const fn = (n: string) => n + '!'
const spied = spy(fn)

spied('a')

console.log(spied.called) // true
console.log(spied.callCount) // 1
console.log(spied.calls) // [['a']]
console.log(spied.results) // [['ok', 'a!']]
console.log(spied.returns) // ['a!']
```

You can reassign mocked function:

```ts
const obj = {
  fn: (n: string) => n + '!',
}
const spied = spyOn(obj, 'fn').willCall((n) => n + '.')

spied('a')

console.log(spied.returns) // ['a.']
```

You can reset calls, returns, called and callCount with `reset` function and restore mock to it's original implementation with `restore` method:

```ts
const obj = {
  fn: (n: string) => n + '!',
}
const spied = spyOn(obj, 'fn').willCall((n) => n + '.')

spied('a')

console.log(spied.called) // true
console.log(spied.callCount) // 1
console.log(spied.calls) // [['a']]
console.log(spied.returns) // ['a.']

spied.reset()

console.log(spied.called) // false
console.log(spied.callCount) // 0
console.log(spied.calls) // []
console.log(spied.returns) // []

spied.restore()

console.log(spied('a')).toBe('a!')
```

### spyOn

> All `spy` methods are available on `spyOn`.

You can spy on an object's method or setter/getter with `spyOn` function.

```ts
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

```ts
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

You can even make an attribute into a dynamic getter!

```ts
let apples = 0
const obj = {
  apples: 13,
}

const spy = spyOn(obj, { getter: 'apples' }, () => apples)

apples = 1

console.log(obj.apples) // prints 1
```

You can restore spied function to it's original value with `restore` method:

```ts
let apples = 0
const obj = {
  getApples: () => 13,
}

const spy = spyOn(obj, 'getApples', () => apples)

console.log(obj.getApples()) // 0

obj.restore()

console.log(obj.getApples()) // 13
```
