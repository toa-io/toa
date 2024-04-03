import type { Captures } from '../Captures'

export function set (this: Captures, value: string, key: string): string {
  this.set(key, value)

  return value
}
