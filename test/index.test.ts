import { test, expect } from 'vitest'

import { spyOn, spy, restoreAll } from '../src/index'

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
  expect(method.results).toEqual(['a!'])

  expect(obj.method('b')).toBe('b!')
  expect(calls).toEqual(['a', 'b'])
  expect(method.callCount).toBe(2)
  expect(method.calls).toEqual([['a'], ['b']])
  expect(method.results).toEqual(['a!', 'b!'])

  method.nextResult('C!')
  expect(obj.method('c')).toBe('C!')
  expect(calls).toEqual(['a', 'b'])
  expect(method.callCount).toBe(3)
  expect(method.calls).toEqual([['a'], ['b'], ['c']])
  expect(method.results).toEqual(['a!', 'b!', 'C!'])

  let error = new Error('test')
  method.nextError(error)
  expect(() => {
    obj.method('d')
  }).toThrowError(error.message)
  expect(calls).toEqual(['a', 'b'])
  expect(method.callCount).toBe(4)
  expect(method.calls).toEqual([['a'], ['b'], ['c'], ['d']])
  expect(method.results).toEqual(['a!', 'b!', 'C!', undefined])

  method.restore()
  expect(obj.method('e')).toBe('e!')
  expect(calls).toEqual(['a', 'b', 'e'])
  expect(method.callCount).toBe(4)
  expect(method.calls).toEqual([['a'], ['b'], ['c'], ['d']])
  expect(method.results).toEqual(['a!', 'b!', 'C!', undefined])
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
  expect(method.results).toEqual(['A!'])
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
  expect(fn.results).toEqual([undefined])

  fn.nextResult('B!')
  expect(fn('b', 'B')).toBe('B!')
  expect(fn.callCount).toBe(2)
  expect(fn.calls).toEqual([
    ['a', 'A'],
    ['b', 'B'],
  ])
  expect(fn.results).toEqual([undefined, 'B!'])

  expect(fn('c', 'C')).toBe(undefined)
  expect(fn.callCount).toBe(3)
  expect(fn.results).toEqual([undefined, 'B!', undefined])

  let error = new Error('test')
  fn.nextError(error)
  expect(fn).toThrowError(error.message)
  expect(fn.callCount).toBe(4)
  expect(fn.results).toEqual([undefined, 'B!', undefined, undefined])
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
  expect(fn.results).toEqual(['a!'])

  fn.nextResult('B!')
  expect(fn('b')).toBe('B!')
  expect(fn.callCount).toBe(2)
  expect(fn.calls).toEqual([['a'], ['b']])
  expect(fn.results).toEqual(['a!', 'B!'])
})
