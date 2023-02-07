import { describe, expect, test } from 'vitest'
import { spyOn, spy } from '../src'

class Dep {
  run(): boolean {
    return false
  }
}

describe('class mock', () => {
  let dep1: Dep
  let dep2: Dep

  test('works with multiple instances', () => {
    dep1 = new Dep()
    const spy1 = spyOn(dep1, 'run')

    dep2 = new Dep()
    const spy2 = spyOn(dep2, 'run')

    dep1.run()
    dep2.run()

    expect(spy1.callCount).toBe(1)
    expect(spy2.callCount).toBe(1)
  })

  test('throws error, if constructor is an arrow function', () => {
    const fnArrow = spy(() => {})
    expect(() => new fnArrow()).toThrowError()
  })

  test('respects new.target', () => {
    let target: unknown = null
    let args: unknown[] = []
    const fnScoped = spy(function (...fnArgs: unknown[]) {
      target = new.target
      args = fnArgs
    })

    new fnScoped('some', 'text', 1)
    expect(target).toBeTypeOf('function')
    expect(args).toEqual(['some', 'text', 1])
    expect(fnScoped.calls).toEqual([['some', 'text', 1]])
  })
})
