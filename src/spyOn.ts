// @ts-nocheck
import { spy, spies, Spy } from './spy'
import { assert, isType } from './utils'

type AnyFunction = (...args: any[]) => any

type Methods<Obj extends object> = {
  [Key in keyof Obj]-?: Obj[Key] extends AnyFunction ? Key : never
}[keyof Obj]

type Getters<Obj extends object> = {
  [Key in keyof Obj]-?: Obj[Key] extends AnyFunction ? never : Key
}[keyof Obj]

const getDescriptor = (obj: any, method: string) =>
  Object.getOwnPropertyDescriptor(obj, method)

// setters exist without getter, so we can check only getters
export function spyOn<O extends object, S extends Getters<O>>(
  obj: O,
  methodName: { setter: S },
  mock?: (arg: any) => any
): Spy<any[], any>
export function spyOn<O extends object, G extends Getters<O>>(
  obj: O,
  methodName: { getter: G },
  mock?: () => any
): Spy<[], any>
export function spyOn<O extends object, M extends Methods<O>>(
  obj: O,
  methodName: M,
  mock?: O[Method]
): O[M] extends (...args: infer A) => infer R ? Spy<A, R> : never
export function spyOn<O extends object, M extends Methods<O>>(
  obj: O,
  methodName: M,
  mock?: O[M]
): O[M] extends (...args: infer A) => infer R ? Spy<A, R> : never {
  assert(
    !isType('undefined', obj),
    'spyOn could not find an object to spy upon'
  )

  assert(
    isType('object', obj) || isType('function', obj),
    'cannot spyOn on a primitive value'
  )

  const getMeta = (): [string, 'value' | 'get' | 'set'] => {
    if (typeof methodName === 'string') {
      return [methodName, 'value']
    }
    if ('getter' in methodName) {
      return [methodName.getter, 'get']
    }
    if ('setter' in methodName) {
      return [methodName.setter, 'set']
    }
  }
  const [accessName, accessType] = getMeta()
  const objDescriptor = getDescriptor(obj, accessName)

  assert(objDescriptor, `${accessName} does not exist`)
  assert(
    objDescriptor.configurable,
    `${accessName} is not declared configurable`
  )

  const proto = Object.getPrototypeOf(obj)
  const protoDescriptor = getDescriptor(proto, accessName)!
  const descriptor = objDescriptor || protoDescriptor
  const origin = descriptor[accessType]
  if (!mock) mock = origin
  const fn = spy(mock.bind(obj))
  const define = (cb) => {
    let { value, ...descr } = descriptor
    if (accessType !== 'value') {
      delete descr.writable // getter/setter can't have writable attribute at all
    }
    descr[accessType] = cb
    Object.defineProperty(objDescriptor ? obj : proto, accessName, descr)
  }
  const restore = () => define(origin)
  fn.restore = restore

  define(fn)

  spies.add(fn)
  return fn
}
