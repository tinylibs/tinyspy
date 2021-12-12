import { spy, spies } from './spy'

export function spyOn(obj, methodName, mock) {
  let origin = obj[methodName]
  if (!mock) mock = origin
  let fn = spy(mock.bind(obj))
  fn.restore = () => {
    obj[methodName] = origin
  }

  obj[methodName] = fn

  spies.push(fn)
  return fn
}
