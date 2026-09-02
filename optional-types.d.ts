export interface Disposable {
  // @ts-ignore -- Symbol.dispose might not be in user types
  [Symbol.dispose]: () => void
}
