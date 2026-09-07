import type { Secret } from '../Secrets.js'

/**
 * What each provider reads from the environment, stated apart from the provider so that a
 * deployment enumerates them without loading the SDK the provider is written against.
 */
export const secrets: Record<Provider, readonly Secret[]> = {
  s3: [
    { name: 'ACCESS_KEY_ID', optional: true },
    { name: 'SECRET_ACCESS_KEY', optional: true }
  ],
  spaces: [{ name: 'ACCESS_KEY_ID' }, { name: 'SECRET_ACCESS_KEY' }],
  cloudinary: [{ name: 'API_KEY' }, { name: 'API_SECRET' }],
  fs: [],
  tmp: [],
  test: [{ name: 'USERNAME' }, { name: 'PASSWORD' }]
}

type Provider = 's3' | 'spaces' | 'cloudinary' | 'fs' | 'tmp' | 'test'
