import { newid } from '@toa.io/generic'
import type { Identity } from './types.ts'

export function create(credentials?: string): Identity {
  return {
    id: newid(),
    scheme: credentials?.split(' ')[0] ?? null,
    refresh: false,
    roles: []
  }
}
