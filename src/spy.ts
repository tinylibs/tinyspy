import { assert, isType } from './utils'

export let spies = new Set<SpyFn<any[], any>>()

type ReturnError = ['error', any]
type ReturnOk<R> = ['ok', R]
type ResultFn<R> = ReturnError | ReturnOk<R>

export interface Spy<A extends any[], R> {
  called: boolean
  callCount: number
  calls: A[]
  length: number
  results: ResultFn<R>[]
  returns: R[]
  nextError(error: any): this
  nextResult(result: R): this
  willCall(cb: (...args: A) => R): this
  restore(): void
  reset(): void
  next: ResultFn<R> | null
}

export interface SpyFn<A extends any[], R> extends Spy<A, R> {
  (...args: A): R
}

export function spy<A extends any[], R>(cb?: (...args: A) => R): SpyFn<A, R> {
  assert(
    isType('function', cb) || isType('undefined', cb),
    'cannot spy on a non-function value'
  )

  const original = cb
  let fn = ((...args: A) => {
    fn.called = true
    fn.callCount += 1
    fn.calls.push(args)
    if (fn.next) {
      let [type, result] = fn.next
      fn.results.push(fn.next)
      fn.next = null
      if (type === 'ok') {
        return result
      }
      throw result
    }
    // it can be thrown (anythig can be thrown),
    // it can be a return value
    // it can be undefined, if there is no mocking function
    let result: any
    let type: 'ok' | 'error' = 'ok'
    if (cb) {
      try {
        result = cb(...args)
        type = 'ok'
      } catch (err: any) {
        result = err
        type = 'error'
      }
    }
    fn.results.push([type, result])
    return result
  }) as SpyFn<A, R>

  Object.defineProperty(fn, 'length', { value: cb ? cb.length : 0 })
  Object.defineProperty(fn, '__isSpy', { value: true })
  Object.defineProperty(fn, 'returns', {
    get(this: SpyFn<A, R>) {
      return this.results.map(([, r]) => r)
    },
  })
  const reset = () => {
    fn.called = false
    fn.callCount = 0
    fn.results = []
    fn.calls = []
  }
  reset()
  fn.reset = reset
  fn.nextError = (error: any) => {
    fn.next = ['error', error]
    return fn
  }
  fn.nextResult = (result: R) => {
    fn.next = ['ok', result]
    return fn
  }
  fn.willCall = (newCb: (...args: A) => R) => {
    cb = newCb
    return fn
  }
  fn.restore = () => (cb = original)

  return fn
}
