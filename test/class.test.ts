import { describe, expect, test } from 'vitest'
import { spyOn } from '../src'

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
})
