import type { Captures } from '../Captures'

export function get (this: Captures, _: unknown, key: string): string {
  const value = this.get(key)

  if (value === undefined)
    throw new Error(`Variable '${key}' is not set`)

  return value
}
