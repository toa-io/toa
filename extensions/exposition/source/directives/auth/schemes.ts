import type { Remote, Scheme } from './types'

export const PROVIDERS: Record<Scheme, Remote> = {
  basic: 'basic',
  token: 'tokens',
  bearer: 'federation',
  otp: 'otp'
}

export const INCEPTION: Remote[] = ['basic', 'federation']
export const PRIMARY: Scheme = 'token'
