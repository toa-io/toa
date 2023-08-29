import { type Reply, type Request } from '@toa.io/types'
import { type KEY } from './const'

export interface Context {
  local: {
    decrypt: (request: Request<string>) => Promise<Reply<DecryptOutput>>
  }
  configuration: Configuration
}

export interface Configuration {
  readonly key0: string
  readonly key1?: string
  readonly stale: number
}

export interface AuthenticateOutput {
  identity: object
  stale: boolean
}

export interface EncryptInput {
  payload: object
  lifetime: number
}

export interface DecryptOutput {
  payload: object
  iat: string
  exp: string
}

export interface Claim {
  [KEY]: object
  iat: string
  exp: string
}
