import { assert, define, isPromise, isType } from './utils'

export let spies = new Set<SpyImpl>()

type ReturnError = ['error', any]
type ReturnOk<R> = ['ok', R]
type ResultFn<R> = ReturnError | ReturnOk<R>

export interface Spy<A extends any[] = any[], R = any> {
  called: boolean
  callCount: number
  calls: A[]
  length: number
  results: ResultFn<R>[]
  returns: R[]
  nextError(error: any): this
  nextResult(result: R): this
  reset(): void
  impl: ((...args: A) => R) | undefined
  next: ResultFn<R> | null
}

export interface SpyImpl<A extends any[] = any[], R = any> extends Spy<A, R> {
  getOriginal(): (...args: A) => R
  willCall(cb: (...args: A) => R): this
  restore(): void
}

export interface SpyFn<A extends any[] = any[], R = any> extends Spy<A, R> {
  (...args: A): R
}

export function spy<A extends any[], R>(cb?: (...args: A) => R): SpyFn<A, R> {
  assert(
    isType('function', cb) || isType('undefined', cb),
    'cannot spy on a non-function value'
  )

  let fn = function (this: any, ...args: A) {
    fn.called = true
    fn.callCount++
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
    // it can be thrown (anything can be thrown),
    // it can be a return value
    // it can be undefined, if there is no mocking function
    let result: any
    let type: 'ok' | 'error' = 'ok'
    if (fn.impl) {
      try {
        result = fn.impl.apply(this, args)
        type = 'ok'
      } catch (err: any) {
        result = err
        type = 'error'
        fn.results.push([type, err])
        throw err
      }
    }
    let resultTuple: ResultFn<R> = [type, result]
    if (isPromise(result)) {
      const newPromise = result
        .then((r: any) => (resultTuple[1] = r))
        .catch((e: any) => {
          resultTuple[0] = 'error'
          resultTuple[1] = e
          throw e
        })
      // we need to reassign it because if it fails, the suite will fail
      // see `async error` test in `test/index.test.ts`
      Object.assign(newPromise, result)
      result = newPromise
    }
    fn.results.push(resultTuple)
    return result
  } as SpyFn<A, R>

  define(fn, '_isMockFunction', { get: () => true })
  define(fn, 'length', { value: cb ? cb.length : 0 })
  define(fn, 'returns', {
    get(this: SpyFn<A, R>) {
      return this.results.map(([, r]) => r)
    },
  })
  define(fn, 'name', { value: cb ? cb.name || 'spy' : 'spy' })
  const reset = () => {
    fn.called = false
    fn.callCount = 0
    fn.results = []
    fn.calls = []
  }
  reset()
  fn.impl = cb
  fn.reset = reset
  fn.nextError = (error: any) => {
    fn.next = ['error', error]
    return fn
  }
  fn.nextResult = (result: R) => {
    fn.next = ['ok', result]
    return fn
  }

  return fn
}
