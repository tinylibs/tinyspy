export let spies = new Set<SpyFn<any[], any>>()

type ReturnError = {
  type: 'error'
  result: any
}

type ReturnOk<Results> = {
  type: 'ok'
  result: Results
}

type ResultFn<Results> = ReturnError | ReturnOk<Results>

export interface Spy<Args extends any[], Returns> {
  called: boolean
  callCount: number
  calls: Args[]
  length: number
  results: ResultFn<Returns>[]
  nextError(error: any): void
  nextResult(result: Returns): void
  willCall(cb: (...args: Args) => Returns): void
  restore(): void
  reset(): void
  next: ['ok', Returns] | ['error', any] | null
}

export interface SpyFn<Args extends any[], Returns> extends Spy<Args, Returns> {
  (...args: Args): Returns
}

export function spy<Args extends any[], Returns>(
  cb?: (...args: Args) => Returns
): SpyFn<Args, Returns> {
  let fn = ((...args: Args) => {
    fn.called = true
    fn.callCount += 1
    fn.calls.push(args)
    if (fn.next) {
      let [type, result] = fn.next
      fn.next = null
      fn.results.push({ type, result })
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
    fn.results.push({ type, result })
    return result
  }) as SpyFn<Args, Returns>

  Object.defineProperty(fn, 'length', { value: cb ? cb.length : 0 })
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
  }
  fn.nextResult = (result: Returns) => {
    fn.next = ['ok', result]
  }
  fn.willCall = (newCb: (...args: Args) => Returns) => {
    cb = newCb
  }

  return fn
}
