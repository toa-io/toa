import { type Remote, type Scheme } from './types'

export const PROVIDERS: Record<Scheme, Remote> = {
  basic: 'basic',
  token: 'tokens'
}

export const PRIMARY: Scheme = 'token'
