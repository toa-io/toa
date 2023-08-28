import { type Reply, type Request } from '@toa.io/types'

export interface Context {
  local: {
    resolve: (request: Request<string>) => Promise<Reply<ResolveOutput>>
  }
  configuration: {
    key0: string
    key1: string
  }
}

export interface AuthenticateOutput {
  identity: object
  upgrade?: string
}

export interface ResolveOutput {
  payload: object
}
