import type { Call, Maybe, Observation } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Entity>
    encrypt: Call<Maybe<string>, EncryptInput>
    decrypt: Call<Maybe<DecryptOutput>, string>
  }
  remote: {
    identity: {
      keys: {
        observe: Observation<CustomKey>
        create: Call<Key>
      }
      roles: {
        list: Call<string[]>
      }
    }
  }
  configuration: Configuration
}

export interface Configuration {
  readonly keys: Record<string, string>
  readonly lifetime: number
  readonly refresh: number
  readonly cache: {
    max: number
    ttl: number
  }
}

export interface Entity {
  revokedAt?: number
}

export interface Identity extends Record<string, any> {
  id: string
  roles: string[]
  permissions?: Record<string, string[]>
}

export interface AuthenticateInput {
  authority: string
  credentials: string
}

export interface AuthenticateOutput {
  identity: Identity
  refresh: boolean
}

export interface EncryptInput {
  authority: string
  identity: Identity
  lifetime?: number
  scopes?: string[]
  permissions?: Record<string, string[]>
  key?: Key
}

export interface DecryptOutput {
  iss: string
  iat: string
  exp?: string
  identity: Identity
  refresh: boolean
}

export interface Claims {
  identity: Identity
  iss: string
  iat: string
  exp?: string
}

export interface Key {
  id: string
  key: string
  label: string
}

export interface CustomKey extends Key {
  identity: string
}
