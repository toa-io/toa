import { env } from '$env/dynamic/public'

export const providers = {
  apple: {
    iss: 'https://appleid.apple.com',
    endpoint: 'https://appleid.apple.com/auth/authorize',
    type: 'code',
    scope: 'openid',
    client: env.PUBLIC_APPLE_CLIENT_ID,
  },
  google: {
    iss: 'https://accounts.google.com',
    endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    type: 'id_token',
    scope: 'openid profile',
    client: env.PUBLIC_GOOGLE_CLIENT_ID,
  },
} as const satisfies Record<string, Descriptor>

export interface Descriptor {
  iss: string
  endpoint: string
  type: 'id_token' | 'code'
  scope: string
  client: string | undefined
}

export type IDP = keyof typeof providers
