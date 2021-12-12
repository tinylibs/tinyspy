import { spies } from './spy'

export function restoreAll() {
  for (let fn of spies) {
    fn.restore()
  }
  spies.clear()
}
