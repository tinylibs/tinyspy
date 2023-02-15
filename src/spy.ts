import { createInternalSpy, populateSpy, Spy } from './internal'

export interface SpyFn<A extends any[] = any[], R = any> extends Spy<A, R> {
  new (...args: A): R extends void ? any : R
  (...args: A): R
}

export function spy<A extends any[], R>(
  cb?: ((...args: A) => R) | { new (...args: A): R }
): SpyFn<A, R> {
  const spy = createInternalSpy(cb)
  populateSpy(spy)
  return spy as any
}
