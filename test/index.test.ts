import { test, expect } from 'vitest'

import { spyOn, spy, restoreAll } from '../src/index'

import { Window } from 'happy-dom'

const resultFactory = (type: string) => (result: any) => [type, result]

const ok = resultFactory('ok')
const error = resultFactory('error')

test('spy is mock function', () => {
  // @ts-expect-error is not public
  expect(spy()._isMockFunction).toBe(true)
  const test = {
    method() {},
  }
  const fn = spyOn(test, 'method')
  // @ts-expect-error is not public
  expect(test.method._isMockFunction).toBe(true)
  // @ts-expect-error is not public
  expect(fn._isMockFunction).toBe(true)
})

test('can spy on method', () => {
  let calls: string[] = []
  let obj = {
    method(arg: string) {
      calls.push(arg)
      return arg + '!'
    },
  }

  let method = spyOn(obj, 'method')
  expect(method.called).toBe(false)
  expect(method.callCount).toBe(0)
  expect(method.calls).toEqual([])
  expect(method.length).toBe(1)
  expect(method.results).toEqual([])

  expect(obj.method('a')).toBe('a!')
  expect(calls).toEqual(['a'])
  expect(method.called).toBe(true)
  expect(method.callCount).toBe(1)
  expect(method.calls).toEqual([['a']])
  expect(method.results).toEqual([ok('a!')])
  expect(method.returns).toEqual(['a!'])

  expect(obj.method('b')).toBe('b!')
  expect(calls).toEqual(['a', 'b'])
  expect(method.callCount).toBe(2)
  expect(method.calls).toEqual([['a'], ['b']])
  expect(method.results).toEqual([ok('a!'), ok('b!')])

  method.nextResult('C!')
  expect(obj.method('c')).toBe('C!')
  expect(calls).toEqual(['a', 'b'])
  expect(method.callCount).toBe(3)
  expect(method.calls).toEqual([['a'], ['b'], ['c']])
  expect(method.results).toEqual([ok('a!'), ok('b!'), ok('C!')])

  let err = new Error('test')
  method.nextError(err)
  expect(() => {
    obj.method('d')
  }).toThrowError(err.message)
  expect(calls).toEqual(['a', 'b'])
  expect(method.callCount).toBe(4)
  expect(method.calls).toEqual([['a'], ['b'], ['c'], ['d']])
  expect(method.results).toEqual([ok('a!'), ok('b!'), ok('C!'), error(err)])

  method.restore()
  expect(obj.method('e')).toBe('e!')
  expect(calls).toEqual(['a', 'b', 'e'])
  expect(method.callCount).toBe(4)
  expect(method.calls).toEqual([['a'], ['b'], ['c'], ['d']])
  expect(method.results).toEqual([ok('a!'), ok('b!'), ok('C!'), error(err)])
})

test('resets all spies', () => {
  let one = {
    method(arg: string) {
      return arg + '!'
    },
  }
  let two = {
    method(arg: string) {
      return arg + '!'
    },
  }

  let spy1 = spyOn(one, 'method')
  let spy2 = spyOn(two, 'method')

  one.method('a')

  expect(spy1.callCount).toBe(1)
  expect(spy2.callCount).toBe(0)

  restoreAll()
  one.method('b')
  two.method('b')
  expect(spy1.callCount).toBe(1)
  expect(spy2.callCount).toBe(0)
})

test('mocks method', () => {
  let calls: string[] = []
  let obj = {
    method(arg: string) {
      calls.push(arg)
      return arg + '!'
    },
  }

  let method = spyOn(obj, 'method', (arg) => {
    return arg.toUpperCase() + '!'
  })

  expect(obj.method('a')).toBe('A!')
  expect(calls).toEqual([])
  expect(method.called).toBe(true)
  expect(method.callCount).toBe(1)
  expect(method.calls).toEqual([['a']])
  expect(method.results).toEqual([ok('A!')])
})

test('mocks getter', () => {
  let calls: string[] = []
  let count = 0
  let obj = {
    get apples() {
      calls.push('called')
      return ++count
    },
  }

  let method = spyOn(obj, { getter: 'apples' })

  expect(obj.apples).toBe(1)
  expect(calls).toEqual(['called'])
  expect(method.called).toBe(true)
  expect(method.callCount).toBe(1)
  expect(method.calls).toEqual([[]])
  expect(method.results).toEqual([ok(1)])

  const newValue = 34
  method.willCall(() => newValue)

  expect(obj.apples).toBe(newValue)
  expect(method.callCount).toBe(2)
  expect(method.calls).toEqual([[], []])
  expect(method.results).toEqual([ok(1), ok(newValue)])
})

test('mocks setter', () => {
  let apples = 0
  let fakedApples = 0
  let obj = {
    get apples() {
      return 0
    },
    set apples(count) {
      apples = count
    },
  }

  let method = spyOn(obj, { setter: 'apples' })

  obj.apples = 55

  expect(obj.apples).toBe(0)
  expect(apples).toBe(55)
  expect(method.called).toBe(true)
  expect(method.callCount).toBe(1)
  expect(method.calls).toEqual([[55]])
  expect(method.results).toEqual([ok(undefined)])

  method.willCall((count) => {
    fakedApples = count
  })

  obj.apples = 199

  expect(obj.apples).toBe(0)
  expect(apples).toBe(55)
  expect(fakedApples).toBe(199)
  expect(method.callCount).toBe(2)
  expect(method.calls).toEqual([[55], [199]])
  expect(method.results).toEqual([ok(undefined), ok(undefined)])
})

test('mocks setter with getter', () => {
  let apples = 0
  let fakedApples = 0
  let obj = {
    get apples() {
      return 0
    },
    set apples(count) {
      apples = count
    },
  }

  let setter = spyOn(obj, { setter: 'apples' }).willCall((count) => {
    fakedApples = count
  })
  let getter = spyOn(obj, { getter: 'apples' }).willCall(() => fakedApples)

  obj.apples = 55

  expect(obj.apples).toBe(55)
  expect(apples).toBe(0)
  expect(fakedApples).toBe(55)

  expect(setter.called).toBe(true)
  expect(setter.callCount).toBe(1)
  expect(setter.calls).toEqual([[55]])
  expect(setter.results).toEqual([ok(undefined)])

  expect(getter.called).toBe(true)
  expect(getter.callCount).toBe(1)
  expect(getter.calls).toEqual([[]])
  expect(getter.results).toEqual([ok(55)])
})

test('has spy for callback', () => {
  let fn = spy()
  expect(fn.called).toBe(false)
  expect(fn.callCount).toBe(0)
  expect(fn.calls).toEqual([])
  expect(fn.length).toBe(0)
  expect(fn.results).toEqual([])

  expect(fn('a', 'A')).toBe(undefined)
  expect(fn.called).toBe(true)
  expect(fn.callCount).toBe(1)
  expect(fn.calls).toEqual([['a', 'A']])
  expect(fn.results).toEqual([ok(undefined)])

  fn.nextResult('B!')
  expect(fn('b', 'B')).toBe('B!')
  expect(fn.callCount).toBe(2)
  expect(fn.calls).toEqual([
    ['a', 'A'],
    ['b', 'B'],
  ])
  expect(fn.results).toEqual([ok(undefined), ok('B!')])

  expect(fn('c', 'C')).toBe(undefined)
  expect(fn.callCount).toBe(3)
  expect(fn.results).toEqual([ok(undefined), ok('B!'), ok(undefined)])

  let err = new Error('test')
  fn.nextError(err)
  expect(fn).toThrowError(err.message)
  expect(fn.callCount).toBe(4)
  expect(fn.results).toEqual([
    ok(undefined),
    ok('B!'),
    ok(undefined),
    error(err),
  ])
})

test('supports spy with callback', () => {
  let fn = spy((name: string): string => {
    return name + '!'
  })

  expect(fn.length).toBe(1)

  expect(fn('a')).toBe('a!')
  expect(fn.called).toBe(true)
  expect(fn.callCount).toBe(1)
  expect(fn.calls).toEqual([['a']])
  expect(fn.results).toEqual([ok('a!')])

  fn.nextResult('B!')
  expect(fn('b')).toBe('B!')
  expect(fn.callCount).toBe(2)
  expect(fn.calls).toEqual([['a'], ['b']])
  expect(fn.results).toEqual([ok('a!'), ok('B!')])
})

test('will resets calls', () => {
  let fn = spy((name: string): string => {
    return name + '!'
  })

  fn('A')
  fn('B')
  fn('C')

  expect(fn.called).toBe(true)
  expect(fn.callCount).toBe(3)
  expect(fn.calls).toEqual([['A'], ['B'], ['C']])
  expect(fn.results).toEqual([ok('A!'), ok('B!'), ok('C!')])

  fn.reset()

  expect(fn.called).toBe(false)
  expect(fn.callCount).toBe(0)
  expect(fn.calls).toEqual([])
  expect(fn.results).toEqual([])
})

// @ts-ignore
test('asserts', () => {
  expect(() => {
    // @ts-ignore
    spy(0)
  }).toThrowError('cannot spy on a non-function value')

  expect(() => {
    // @ts-ignore
    spyOn(0)
  }).toThrowError('cannot spyOn on a primitive value')

  expect(() => {
    // @ts-ignore
    spyOn()
  }).toThrowError('spyOn could not find an object to spy upon')

  expect(() => {
    // @ts-ignore
    spyOn({}, 'test')
  }).toThrowError('test does not exist')
})

test('spying on proto', () => {
  const obj = Object.create(null)
  Object.setPrototypeOf(obj, {
    method() {
      return '123'
    },
  })
  const descriptor = Object.getOwnPropertyDescriptor(obj, 'method')

  expect(descriptor).toBeUndefined()

  const spy = spyOn(obj, 'method')

  obj.method()

  expect(spy.called).toBe(true)
})

test('vite ssr support', () => {
  const method = (arg: string) => 5

  const obj = {
    get method() {
      return method
    },
  } as { method: (arg: string) => 5 }

  const spy = spyOn(obj, 'method')

  obj.method

  expect(spy.callCount).toBe(0)

  obj.method('hello')

  expect(spy.callCount).toBe(1)
  expect(spy.calls).toEqual([['hello']])
  expect(spy.returns).toEqual([5])
})

test('obj getter', () => {
  const obj = {
    num: 3,
    get count() {
      return this.num + 1
    },
  }

  const spy = spyOn(obj, { getter: 'count' })

  expect(obj.count).toBe(4)

  obj.num = 55

  expect(obj.count).toBe(56)

  expect(spy.callCount).toBe(2)
})

test('instance', () => {
  class Test {
    props = 0
    method() {
      return this.props
    }
  }

  const t = new Test()

  const spy = spyOn(t, 'method')

  t.method()

  expect(spy.returns).toEqual([0])

  spy.willCall(function () {
    this.world = 'hello'
    this.props = 2
    return this.world
  })

  t.method()

  expect(spy.returns).toEqual([0, 'hello'])
  expect(t.props).toBe(2)
})

test('async', async () => {
  let counter = 0
  const obj = {
    async method() {
      return ++counter
    },
  }

  const spy = spyOn(obj, 'method')

  const promise = obj.method()

  expect(spy.called).toBe(true)
  expect(spy.results[0][1]).toBeInstanceOf(Promise)

  const count = await promise

  expect(spy.results).toEqual([['ok', 1]])
  expect(count).toBe(1)
})

test('async error', async () => {
  const obj = {
    async method() {
      throw new Error('async error')
    },
  }

  const spy = spyOn(obj, 'method')
  const promise = obj.method()

  expect(spy.called).toBe(true)
  expect(spy.results[0][1]).toBeInstanceOf(Promise)

  let caughtError: null | Error = null
  try {
    await promise
  } catch (e) {
    caughtError = e
  }

  expect(spy.results[0][0]).toEqual('error')
  expect(spy.results[0][1].message).toEqual('async error')
  expect(caughtError).toBeInstanceOf(Error)
  expect(caughtError?.message).toEqual('async error')
})

test('proto null', () => {
  const obj = Object.create(null)

  obj.method = () => true

  const spy = spyOn(obj, 'method')

  obj.method()

  expect(spy.called).toBe(true)
  expect(spy.returns[0]).toBe(true)
})

test('retains name', () => {
  function count() {
    return 1
  }

  expect(spy(count).name).toBe('count')

  expect(spy(count.bind({})).name).toBe('bound count')

  expect(spy(() => true).name).toBe('spy')

  const obj = {
    count,
  }

  spyOn(obj, 'count')

  expect(obj.count.name).toBe('count')
})

test('cb with context', () => {
  const instances: any[] = []
  function Names() {
    instances.push(this)
    this.array = []
  }

  const n = new Names()

  expect(n.array).toEqual([])

  const Spied = spy(Names)

  const s = new Spied()

  expect(s.array).toEqual([])
  expect(instances[1]).toEqual({ array: [] })
})

test('cb method with context', () => {
  const instances: any[] = []
  function Names() {
    instances.push(this)
    this.array = []
  }
  const obj = {
    Names,
  }

  spyOn(obj, 'Names')

  const s = new obj.Names()

  expect(s.array).toEqual([])
  expect(instances[0]).toEqual({ array: [] })
})

test('method sets properties on obj', () => {
  const instances: any[] = []
  function Names() {
    instances.push(this)
    this.array = [1]
  }
  const obj = {
    array: [],
    Names,
  }

  spyOn(obj, 'Names')

  const s = new obj.Names()

  expect(s.array).toEqual([1])
  expect(instances[0]).toEqual({ array: [1] })

  obj.Names()

  expect(obj.array).toEqual([1])
})

test('no descriptor', () => {
  const w = new Window()

  const head = w.document.head
  const descriptorObj = Object.getOwnPropertyDescriptor(head, 'appendChild')
  const descriptorProto = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(head),
    'appendChild'
  )

  expect(descriptorObj).toBeUndefined()
  expect(descriptorProto).toBeUndefined()
  expect(head.appendChild).toBeTruthy()

  const spy = spyOn(head, 'appendChild')

  const div = w.document.createElement('div')

  head.appendChild(div)

  expect(spy.called).toBe(true)
  expect(spy.calls[0][0]).toBe(div)

  const getter = spyOn(head, { getter: 'childElementCount' }, () => 42)

  const count = head.childElementCount

  expect(count).toBe(42)
  expect(getter.called).toBe(true)
  expect(getter.returns[0]).toBe(42)
})

test('throw error', () => {
  const obj = {
    err: () => {},
  }

  spyOn(obj, 'err').willCall(() => {
    throw new Error('oh no')
  })

  try {
    obj.err()
    expect.fail('should be catched')
  } catch (err) {
    expect(err.message).toBe('oh no')
  }
})

test('mock symbol methods', () => {
  const sym = Symbol()
  const obj = {
    [sym]: () => {},
  }

  const spy = spyOn(obj, sym)

  obj[sym]()

  expect(spy.called).toBe(true)
})

test('mock number methods', () => {
  const obj = {
    [4]: () => {},
  }

  const spy = spyOn(obj, 4)

  obj[4]()

  expect(spy.called).toBe(true)
})

test('preserves promise', async () => {
  const cancelFn = spy()
  const fn = spy(() => {
    const promise = new Promise<void>((resolve) =>
      resolve()
    ) as Promise<void> & {
      cancel: () => void
    }
    promise.cancel = cancelFn
    return promise
  })

  const res = fn()

  await res

  expect(res).toHaveProperty('cancel')
  expect(res.cancel).toBe(cancelFn)
})

test('can chain a promise', async () => {
  const fn = spy(() => Promise.resolve())
  const chain1 = spy()
  const chain2 = spy()
  const error = spy()
  const onFinally = spy()

  await fn().then(chain1).then(chain2).catch(error).finally(onFinally)

  expect(chain1.called).toBe(true)
  expect(chain2.called).toBe(true)
  expect(error.called).toBe(false)
  expect(onFinally.called).toBe(true)
})

test('does not await on non-promise values that contain .then', async () => {
  class ChainablePromiselike {
    private values: string[] = []

    addValue(value: string) {
      this.values.push(value)
      return this
    }

    then(fn: () => {}) {
      return Promise.resolve(this.values).then(fn)
    }
  }

  const originalResult = new ChainablePromiselike()
    .addValue('Hello')
    .addValue('World')
  const spied = spy(() => new ChainablePromiselike())
  const spiedResult = spied().addValue('Hello').addValue('World')
  expect(spiedResult).toStrictEqual(originalResult)
})

test('spyOn with new.target', () => {
  const fn = {
    fnFunc: () => {},
    fnClass: class FnClass {},
  }

  spyOn(fn, 'fnFunc').willCall(function () {
    expect(new.target).toBeUndefined()
  })
  spyOn(fn, 'fnClass').willCall(function () {
    expect(new.target).toBeDefined()
    return fn.fnClass
  })

  fn.fnFunc()
  new fn.fnClass()
})
