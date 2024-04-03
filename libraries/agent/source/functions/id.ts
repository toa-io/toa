import { newid } from '@toa.io/generic'

export function id (): string {
  return newid()
}
