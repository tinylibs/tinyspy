## Usage

> Warning! Does not support mocking ES Modules. You can use it with `vitest`, who does additional transpormations, to mock ESM.

### spy

Simplest usage would be:

```ts
const fn = (n: string) => n + '!'
const spied = spy(fn)

fn('a')

console.log(method.called) // true
console.log(method.callCount) // 1
console.log(method.calls) // [['a']]
console.log(method.results) // [['ok', 'a!']
console.log(method.returns) // ['a!']
```

You can reassign mocked function:

```ts
const fn = (n: string) => n + '!'
const spied = spy(fn).willCall((n) => n + '.')

fn('a')

console.log(method.returns) // ['a.']
```

You can reset calls, returns, called and callCount with `reset` function and restore mock to it's original implementation with `restore` method:

```ts
const fn = (n: string) => n + '!'
const spied = spy(fn).willCall((n) => n + '.')

fn('a')

console.log(method.called) // true
console.log(method.callCount) // 1
console.log(method.calls) // [['a']]
console.log(method.returns) // ['a.']

fn.reset()

console.log(method.called) // false
console.log(method.callCount) // 0
console.log(method.calls) // []
console.log(method.returns) // []

fn.restore()

console.log(fn('a')).toBe('a!')

// still spied on!
console.log(method.callCount) // 1
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
