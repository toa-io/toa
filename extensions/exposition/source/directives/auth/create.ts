import { newid } from '@toa.io/generic'
import type { Identity } from './types'

export function create (credentials?: string): Identity {
  const scheme = credentials === undefined
    ? null
    : credentials.split(' ')[0]

  return { id: newid(), scheme, refresh: false, roles: [] }
}
