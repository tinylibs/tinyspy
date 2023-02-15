export function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

export function isType(type: string, value: any) {
  return typeof value === type
}

export function isPromise(value: any) {
  return value instanceof Promise
}

export function define(
  obj: any,
  key: string | number | symbol,
  descriptor: PropertyDescriptor
) {
  Object.defineProperty(obj, key, descriptor)
}

export function defineValue(
  obj: any,
  key: string | number | symbol,
  value: unknown
) {
  Object.defineProperty(obj, key, { value })
}
