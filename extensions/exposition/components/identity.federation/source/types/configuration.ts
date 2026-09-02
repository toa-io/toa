import type { Secret } from '@toa.io/types'

export interface Configuration {
  trust: Trust[]
  principal?: Principal
  assert?: boolean
}

export interface Trust {
  iss: string
  aud?: string | [string, ...string[]]
  secret?: Secret
  signature?: {
    iss: string
    kid: string
    key: Secret
  }
}

interface Principal {
  iss: string
  sub: string
}
