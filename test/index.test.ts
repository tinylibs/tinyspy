import { test, expect } from 'vitest'

import { spyOn, spy, restoreAll } from '../index.js'

test('can spy on method', () => {
  let calls: string[] = []
  let obj = {
    method(arg: string) {
      calls.push(arg)
      return arg + '!'
    },
  }

  let method = spyOn(obj, 'method')
  is(method.called, false)
  equal(method.callCount, 0)
  equal(method.calls, [])
  equal(method.length, 1)
  equal(method.results, [])

  equal(obj.method('a'), 'a!')
  equal(calls, ['a'])
  is(method.called, true)
  equal(method.callCount, 1)
  equal(method.calls, [['a']])
  equal(method.results, ['a!'])

  equal(obj.method('b'), 'b!')
  equal(calls, ['a', 'b'])
  equal(method.callCount, 2)
  equal(method.calls, [['a'], ['b']])
  equal(method.results, ['a!', 'b!'])

  method.nextResult('C!')
  equal(obj.method('c'), 'C!')
  equal(calls, ['a', 'b'])
  equal(method.callCount, 3)
  equal(method.calls, [['a'], ['b'], ['c']])
  equal(method.results, ['a!', 'b!', 'C!'])

  let error = new Error('test')
  method.nextError(error)
  throws(() => {
    obj.method('d')
  }, error)
  equal(calls, ['a', 'b'])
  equal(method.callCount, 4)
  equal(method.calls, [['a'], ['b'], ['c'], ['d']])
  equal(method.results, ['a!', 'b!', 'C!', undefined])

  method.restore()
  equal(obj.method('e'), 'e!')
  equal(calls, ['a', 'b', 'e'])
  equal(method.callCount, 4)
  equal(method.calls, [['a'], ['b'], ['c'], ['d']])
  equal(method.results, ['a!', 'b!', 'C!', undefined])
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
  equal(spy1.callCount, 1)
  equal(spy2.callCount, 0)

  restoreAll()
  one.method('b')
  two.method('b')
  equal(spy1.callCount, 1)
  equal(spy2.callCount, 0)
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

  equal(obj.method('a'), 'A!')
  equal(calls, [])
  is(method.called, true)
  equal(method.callCount, 1)
  equal(method.calls, [['a']])
  equal(method.results, ['A!'])
})

test('has spy for callback', () => {
  let fn = spy()
  is(fn.called, false)
  equal(fn.callCount, 0)
  equal(fn.calls, [])
  equal(fn.length, 0)
  equal(fn.results, [])

  is(fn('a', 'A'), undefined)
  is(fn.called, true)
  equal(fn.callCount, 1)
  equal(fn.calls, [['a', 'A']])
  equal(fn.results, [undefined])

  fn.nextResult('B!')
  equal(fn('b', 'B'), 'B!')
  equal(fn.callCount, 2)
  equal(fn.calls, [
    ['a', 'A'],
    ['b', 'B'],
  ])
  equal(fn.results, [undefined, 'B!'])

  is(fn('c', 'C'), undefined)
  equal(fn.callCount, 3)
  equal(fn.results, [undefined, 'B!', undefined])

  let error = new Error('test')
  fn.nextError(error)
  throws(fn, error)
  equal(fn.callCount, 4)
  equal(fn.results, [undefined, 'B!', undefined, undefined])
})

test('supports spy with callback', () => {
  let fn = spy((name: string): string => {
    return name + '!'
  })

  equal(fn.length, 1)

  equal(fn('a'), 'a!')
  is(fn.called, true)
  equal(fn.callCount, 1)
  equal(fn.calls, [['a']])
  equal(fn.results, ['a!'])

  fn.nextResult('B!')
  equal(fn('b'), 'B!')
  equal(fn.callCount, 2)
  equal(fn.calls, [['a'], ['b']])
  equal(fn.results, ['a!', 'B!'])
})
