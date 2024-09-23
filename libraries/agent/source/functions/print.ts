import type { Captures } from '../Captures'

export function print (this: Captures, value: string): string {
  console.log(value)

  return value
}
