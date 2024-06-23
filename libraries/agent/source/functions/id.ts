import { newid } from '@toa.io/generic'

export function id (_: unknown, length?: string): string {
  return newid().slice(0, length === undefined ? 32 : Number.parseInt(length))
}
