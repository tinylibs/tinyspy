import { assert, define, defineValue, isPromise, isType } from './utils'
import { S } from './constants'

interface GetState {
  <A extends any[], R>(spy: SpyInternalImpl<A, R>): SpyInternalImplState<A, R>
  <A extends any[], R>(spy: SpyInternal<A, R>): SpyInternalState<A, R>
}

export let spies = new Set<SpyImpl>()

let reset = (state: SpyInternalState) => {
  state.called = false
  state.callCount = 0
  state.calls = []
  state.results = []
}
let defineState = (spy: SpyInternal) => {
  define(spy, S, { value: { reset: () => reset(spy[S]) } })
  return spy[S]
}
export let getInternalState: GetState = (spy) => {
  return (spy[S] || defineState(spy)) as any
}

type ReturnError = ['error', any]
type ReturnOk<R> = ['ok', R]
type ResultFn<R> = ReturnError | ReturnOk<R>

export interface SpyInternal<A extends any[] = any[], R = any> {
  (this: any, ...args: A): R
  [S]: SpyInternalState<A, R>
}

export interface SpyInternalImpl<A extends any[] = any[], R = any>
  extends SpyInternal<A, R> {
  [S]: SpyInternalImplState<A, R>
}

interface SpyInternalState<A extends any[] = any[], R = any> {
  called: boolean
  callCount: number
  calls: A[]
  results: ResultFn<R>[]
  reset(): void
  impl: ((...args: A) => R) | undefined
  next: ResultFn<R> | null
}

interface SpyInternalImplState<A extends any[] = any[], R = any>
  extends SpyInternalState<A, R> {
  getOriginal(): (...args: A) => R
  willCall(cb: (...args: A) => R): this
  restore(): void
}

export interface Spy<A extends any[] = any[], R = any>
  extends SpyInternalState<A, R> {
  returns: R[]
  length: number
  nextError(error: any): this
  nextResult(result: R): this
}

export interface SpyImpl<A extends any[] = any[], R = any> extends Spy<A, R> {
  getOriginal(): (...args: A) => R
  willCall(cb: (...args: A) => R): this
  restore(): void
}

export function createInternalSpy<A extends any[], R>(
  cb?: ((...args: A) => R) | { new (...args: A): R }
): SpyInternal<A, R> {
  assert(
    isType('function', cb) || isType('undefined', cb),
    'cannot spy on a non-function value'
  )

  let fn = function (this: any, ...args: A) {
    const state = getInternalState(fn)
    state.called = true
    state.callCount++
    state.calls.push(args)
    if (state.next) {
      let [type, result] = state.next
      state.results.push(state.next)
      state.next = null
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
    if (state.impl) {
      try {
        result = state.impl.apply(this, args)
        type = 'ok'
      } catch (err: any) {
        result = err
        type = 'error'
        state.results.push([type, err])
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
    state.results.push(resultTuple)
    return result
  } as SpyInternal<A, R>

  defineValue(fn, '_isMockFunction', true)
  defineValue(fn, 'length', cb ? cb.length : 0)
  defineValue(fn, 'name', cb ? cb.name || 'spy' : 'spy')

  const I = getInternalState(fn)
  I.reset()
  I.impl = cb as any

  return fn
}

export function populateSpy<A extends any[], R>(spy: SpyInternal<A, R>) {
  const I = getInternalState(spy)

  define(spy, 'returns', {
    get: () => I.results.map(([, r]) => r),
  })
  ;(
    ['called', 'callCount', 'results', 'calls', 'reset', 'impl'] as const
  ).forEach((n) =>
    define(spy, n, { get: () => I[n], set: (v) => (I[n] = v as never) })
  )
  defineValue(spy, 'nextError', (error: any) => {
    I.next = ['error', error]
    return I
  })
  defineValue(spy, 'nextResult', (result: R) => {
    I.next = ['ok', result]
    return I
  })
}
