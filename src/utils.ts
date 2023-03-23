export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function isType(type: 'undefined', value: any): value is undefined
export function isType(type: 'function', value: any): value is () => void
export function isType(type: 'object', value: any): value is object
export function isType(type: 'string', value: any): value is string
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
