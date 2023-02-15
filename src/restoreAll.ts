import { spies } from './internal'

export function restoreAll() {
  for (let fn of spies) {
    fn.restore()
  }
  spies.clear()
}
