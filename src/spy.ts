import { assert } from './utils'

export let spies = new Set<SpyFn<any[], any>>()

type ReturnError = ['error', any]
type ReturnOk<Results> = ['ok', Results]
type ResultFn<Results> = ReturnError | ReturnOk<Results>

export interface Spy<Args extends any[], Returns> {
  called: boolean
  callCount: number
  calls: Args[]
  length: number
  results: ResultFn<Returns>[]
  returns: Returns[]
  nextError(error: any): this
  nextResult(result: Returns): this
  willCall(cb: (...args: Args) => Returns): this
  restore(): void
  reset(): void
  next: ResultFn<Returns> | null
}

export interface SpyFn<Args extends any[], Returns> extends Spy<Args, Returns> {
  (...args: Args): Returns
}

export function spy<Args extends any[], Returns>(
  cb?: (...args: Args) => Returns
): SpyFn<Args, Returns> {
  assert(
    typeof cb === 'function' || typeof cb === 'undefined',
    'cannot spy on a non-function value'
  )

  const original = cb
  let fn = ((...args: Args) => {
    fn.called = true
    fn.callCount += 1
    fn.calls.push(args)
    if (fn.next) {
      let [type, result] = fn.next
      fn.results.push(fn.next)
      fn.next = null
      if (type === 'error') {
        throw result
      }
      return result
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
  }) as SpyFn<Args, Returns>

  Object.defineProperty(fn, 'length', { value: cb ? cb.length : 0 })
  Object.defineProperty(fn, 'returns', {
    get(this: SpyFn<Args, Returns>) {
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
  fn.nextResult = (result: Returns) => {
    fn.next = ['ok', result]
    return fn
  }
  fn.willCall = (newCb: (...args: Args) => Returns) => {
    cb = newCb
    return fn
  }
  fn.restore = () => (cb = original)

  return fn
}
