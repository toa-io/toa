import { newid } from '@toa.io/generic'

export function email (_: unknown, domain: string = '@agent.test'): string {
  return newid() + domain
}
