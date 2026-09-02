import type { Secret } from '@toa.io/types'

export interface Configuration {
  trust: Trust[]
  principal?: Principal
  assert?: boolean
}

export interface Trust {
  iss: string
  aud?: string | [string, ...string[]]
  secret?: string | Secret
  signature?: {
    iss: string
    kid: string
    key: string | Secret
  }
}

interface Principal {
  iss: string
  sub: string
}
