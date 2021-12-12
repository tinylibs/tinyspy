// @ts-nocheck
export let spies: SpyFn<unknown>[] = []

export interface Spy<
  Fn extends (...args: any[]) => any = (...args: any[]) => any
> {
  called: boolean
  callCount: number
  calls: Parameters<Fn>[]
  length: number
  results: ReturnType<Fn>[]
  nextError(error: Error): void
  nextResult(result: ReturnType<Fn>): void
  restore(): void
  next: ['ok', ReturnType<Fn>] | ['error', Error] | null
}

export interface SpyFn<
  Fn extends (...args: any[]) => any = (...args: any[]) => any
> extends Spy {
  (...args: Parameters<Fn>): ReturnType<Fn>
}

export function spy<
  Fn extends (...args: any[]) => any = (...args: any[]) => any
>(cb?: Fn): SpyFn<Fn> {
  // @ts-ignore
  let fn: SpyFn<Fn> = (...args) => {
    fn.called = true
    fn.callCount += 1
    fn.calls.push(args)
    if (fn.next) {
      let [nextType, nextResult] = fn.next
      fn.next = null
      if (nextType === 'error') {
        fn.results.push(undefined)
        throw nextResult
      } else {
        fn.results.push(nextResult)
        return nextResult
      }
    } else {
      let result: ReturnType<Fn>
      if (cb) result = cb(...args)
      fn.results.push(result)
      return result
    }
  }

  Object.defineProperty(fn, 'length', { value: cb ? cb.length : 0 })
  fn.called = false
  fn.callCount = 0
  fn.results = []
  fn.calls = []
  fn.nextError = (error) => {
    fn.next = ['error', error]
  }
  fn.nextResult = (result) => {
    fn.next = ['ok', result]
  }

  return fn
}
