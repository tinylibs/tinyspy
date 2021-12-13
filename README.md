# tinyspy

> minimal fork of nanospy, with more features 🕵🏻‍♂️

## Usage

> Warning! Does not support mocking ES Modules. You can use it with `vitest`, who does additional transpormations, to mock ESM.

### spy

Simplest usage would be:

```ts
const fn = (n: string) => n + '!'
const spied = spy(fn)

fn('a')

expect(calls).toEqual(['a'])
expect(method.called).toBe(true)
expect(method.callCount).toBe(1)
expect(method.calls).toEqual([['a']])
expect(method.results).toEqual([['ok', 'a!'])
expect(method.returns).toEqual(['a!'])
```

You can reassign mocked function:

```ts
const fn = (n: string) => n + '!'
const spied = spy(fn).wilLCall((n) => n + '.')

fn('a')

expect(method.returns).toEqual(['a.'])
```

### spyOn

> All `spy` methods are available on `spyOn`.

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
