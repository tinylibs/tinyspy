export function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

export function isType(type: string, value: any) {
  return typeof value === type
}

export function define(
  obj: any,
  key: string | number | symbol,
  descriptor: PropertyDescriptor
) {
  Object.defineProperty(obj, key, descriptor)
}
