import { spies } from './internal.js'

export function restoreAll() {
  for (let fn of spies) {
    fn.restore()
  }
  spies.clear()
}
