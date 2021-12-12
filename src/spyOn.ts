// @ts-nocheck
import { spy, spies, Spy } from './spy'

type Methods<Obj extends object> = {
  [Key in keyof Obj]-?: Obj[Key] extends (...args: any[]) => any ? Key : never
}[keyof Obj]

export function spyOn<Obj extends object, Method extends Methods<Obj>>(
  obj: Obj,
  methodName: Method,
  mock?: Obj[Method]
  // @ts-ignore
): Spy<Obj[Method]> {
  let origin = obj[methodName]
  if (!mock) mock = origin
  // @ts-ignore
  let fn = spy(mock.bind(obj))
  fn.restore = () => {
    obj[methodName] = origin
  }

  // @ts-ignore
  obj[methodName] = fn

  spies.push(fn)
  // @ts-ignore
  return fn
}
