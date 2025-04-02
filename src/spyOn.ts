import {
  createInternalSpy,
  isMockFunction,
  populateSpy,
  spies,
  SpyImpl,
  SpyInternal,
  SpyInternalImpl,
} from './internal.js'
import { assert, define, defineValue, descriptors, isType } from './utils.js'
import { SYMBOL_STATE } from './constants.js'

type Procedure = (...args: any[]) => any

type Methods<T> = {
  [K in keyof T]: T[K] extends Procedure ? K : never
}[keyof T]
type Getters<T> = {
  [K in keyof T]: T[K] extends Procedure ? never : K
}[keyof T]
type Constructors<T> = {
  [K in keyof T]: T[K] extends new (...args: any[]) => any ? K : never
}[keyof T]

let getDescriptor = (obj: any, method: string | symbol | number) =>
  Object.getOwnPropertyDescriptor(obj, method)

let setPototype = (fn: any, val: any) => {
  if (val != null && typeof val === 'function' && val.prototype != null) {
    // inherit prototype, keep original prototype chain
    Object.setPrototypeOf(fn.prototype, val.prototype)
  }
}

export function internalSpyOn<T, K extends string & keyof T>(
  obj: T,
  methodName: K | { getter: K } | { setter: K },
  mock?: Procedure
): SpyInternalImpl<any[], any> {
  assert(
    !isType('undefined', obj),
    'spyOn could not find an object to spy upon'
  )

  assert(
    isType('object', obj) || isType('function', obj),
    'cannot spyOn on a primitive value'
  )

  let [accessName, accessType] = ((): [
    string | symbol | number,
    'value' | 'get' | 'set',
  ] => {
    if (!isType('object', methodName)) {
      return [methodName, 'value']
    }
    if ('getter' in methodName && 'setter' in methodName) {
      throw new Error('cannot spy on both getter and setter')
    }
    if ('getter' in methodName) {
      return [methodName.getter, 'get']
    }
    if ('setter' in methodName) {
      return [methodName.setter, 'set']
    }
    throw new Error('specify getter or setter to spy on')
  })()
  let objDescriptor = getDescriptor(obj, accessName)
  let proto = Object.getPrototypeOf(obj)
  let protoDescriptor = proto && getDescriptor(proto, accessName)
  let originalDescriptor = objDescriptor || protoDescriptor

  assert(
    originalDescriptor || accessName in obj,
    `${String(accessName)} does not exist`
  )

  let ssr = false

  // vite ssr support - actual function is stored inside a getter
  if (
    accessType === 'value' &&
    originalDescriptor &&
    !originalDescriptor.value &&
    originalDescriptor.get
  ) {
    accessType = 'get'
    ssr = true
    mock = originalDescriptor.get!()
  }

  let original: Procedure | undefined

  if (originalDescriptor) {
    original = originalDescriptor[accessType]
  } else if (accessType !== 'value') {
    original = () => obj[accessName as keyof T]
  } else {
    original = obj[accessName as keyof T] as unknown as Procedure
  }

  if (original && isSpyFunction(original)) {
    original = original[SYMBOL_STATE].getOriginal()
  }

  let reassign = (cb: any) => {
    let { value, ...desc } = originalDescriptor || {
      configurable: true,
      writable: true,
    }
    if (accessType !== 'value') {
      delete desc.writable // getter/setter can't have writable attribute at all
    }
    ;(desc as PropertyDescriptor)[accessType] = cb
    define(obj, accessName, desc)
  }
  let restore = () =>
    originalDescriptor && !original
      ? define(obj, accessName, originalDescriptor)
      : reassign(original)

  if (!mock) mock = original

  // let fn: SpyInternal
  // if (origin && S in origin) {
  //   fn = origin as SpyInternal
  // } else {
  let spy = wrap(createInternalSpy(mock), mock)
  if (accessType === 'value') {
    setPototype(spy, original)
  }

  const state = spy[SYMBOL_STATE]
  defineValue(state, 'restore', restore)
  defineValue(state, 'getOriginal', () => (ssr ? original!() : original))
  defineValue(state, 'willCall', (newCb: Procedure) => {
    state.impl = newCb
    return spy
  })
  // }

  reassign(
    ssr
      ? () => {
          setPototype(spy, mock)
          return spy
        }
      : spy
  )

  spies.add(spy as any)
  return spy as any
}

const builtinDescriptors = descriptors(Function.prototype)

function wrap(mock: SpyInternal, original: Procedure | undefined): SpyInternal {
  if (
    !original ||
    // the original is already a spy, so it has all the properties
    SYMBOL_STATE in original
  ) {
    return mock
  }

  const originalStaticDescriptors = descriptors(original)
  const propertyNames = [
    ...Object.getOwnPropertyNames(original),
    ...Object.getOwnPropertySymbols(original),
  ] as (keyof typeof original)[]

  for (const key of propertyNames) {
    if (key in builtinDescriptors || key === 'prototype') {
      continue
    }
    const descriptor = originalStaticDescriptors[key]!
    const mockDescriptor = getDescriptor(mock, key)
    if (mockDescriptor) {
      continue
    }

    define(mock, key, descriptor)
  }
  return mock
}

// setters exist without getter, so we can check only getters
export function spyOn<T, S extends Getters<Required<T>>>(
  obj: T,
  methodName: { setter: S },
  mock?: (arg: T[S]) => void
): SpyImpl<[T[S]], void>
export function spyOn<T, G extends Getters<Required<T>>>(
  obj: T,
  methodName: { getter: G },
  mock?: () => T[G]
): SpyImpl<[], T[G]>
export function spyOn<T, M extends Constructors<Required<T>>>(
  object: T,
  method: M
): Required<T>[M] extends new (...args: infer A) => infer R
  ? SpyImpl<A, R>
  : never
export function spyOn<T, M extends Methods<Required<T>>>(
  obj: T,
  methodName: M,
  mock?: T[M]
): Required<T>[M] extends (...args: infer A) => infer R ? SpyImpl<A, R> : never
export function spyOn<T extends object, K extends string & keyof T>(
  obj: T,
  methodName: K | { getter: K } | { setter: K },
  mock?: Procedure
): SpyImpl<any[], any> {
  const spy = internalSpyOn(obj, methodName, mock)
  populateSpy(spy)
  ;(['restore', 'getOriginal', 'willCall'] as const).forEach((method) => {
    defineValue(spy, method, spy[SYMBOL_STATE][method])
  })
  return spy as any as SpyImpl
}

function isSpyFunction(obj: any): obj is SpyInternalImpl {
  return isMockFunction(obj) && 'getOriginal' in obj[SYMBOL_STATE]
}
