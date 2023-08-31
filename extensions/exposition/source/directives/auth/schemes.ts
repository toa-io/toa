import { type Provider, type Scheme } from './types'

export const PROVIDERS: Record<Scheme, Provider> = {
  basic: 'basic',
  token: 'tokens'
}

export const PRIMARY: Scheme = 'token'
