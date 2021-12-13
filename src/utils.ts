export function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

export function isType(type: string, value: any) {
  return typeof value === type
}
