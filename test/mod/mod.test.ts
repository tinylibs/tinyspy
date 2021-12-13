import { test, expect } from 'vitest'
import { spyOn } from '../../src/index'
import { foo } from './mod'
import { other } from './other'

test('spyOn module', () => {
  const getterSpy = spyOn(foo, { getter: 'aGetter' }, () => '123')
  const fooSpy = spyOn(foo, 'aFunction', () => '555')

  expect(other().aGetter).toBe('123')
  expect(getterSpy.called).toBe(true)

  expect(other().aFunction()).toBe('555')
  expect(fooSpy.called).toBe(true)
})
