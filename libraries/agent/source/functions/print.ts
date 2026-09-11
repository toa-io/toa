import type { Captures } from '../Captures.ts'

export function print(this: Captures, value: string): string {
  console.log(value)

  return value
}
