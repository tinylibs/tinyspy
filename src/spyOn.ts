// @ts-nocheck
import { spy, spies, Spy } from './spy'

type Methods<Obj extends object> = {
  [Key in keyof Obj]-?: Obj[Key] extends (...args: any[]) => any ? Key : never
}[keyof Obj]

type Getters<Obj extends object> = {
  [Key in keyof Obj]-?: Obj[Key] extends (...args: any[]) => any ? never : Key
}[keyof Obj]

const getDescriptor = (obj: any, method: string) =>
  Object.getOwnPropertyDescriptor(obj, method)

// setters exist withour getter, so we can check only getters
export function spyOn<Obj extends object, Setters extends Getters<Obj>>(
  obj: Obj,
  methodName: { setter: Setters },
  mock?: (arg: any) => any
): Spy<any[], any>
export function spyOn<Obj extends object, Getter extends Getters<Obj>>(
  obj: Obj,
  methodName: { getter: Getter },
  mock?: () => any
): Spy<[], any>
export function spyOn<Obj extends object, Method extends Methods<Obj>>(
  obj: Obj,
  methodName: Method,
  mock?: Obj[Method]
): Spy<Parameters<Obj[Method]>, ReturnType<Obj[Method]>>
export function spyOn<Obj extends object, Method extends Methods<Obj>>(
  obj: Obj,
  methodName: Method,
  mock?: Obj[Method]
): Spy<Parameters<Obj[Method]>, ReturnType<Obj[Method]>> {
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
