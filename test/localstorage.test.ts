/**
 * @vitest-environment jsdom
 */

import { describe, expect, test } from 'vitest'
import { spyOn } from '../src'

describe('localStorage mock', () => {
  test('works correctly', async () => {
    const spy = spyOn(localStorage, 'getItem', () => 'world')
    expect(localStorage.getItem('hello')).toEqual('world')

    spy.restore()
  })
})
