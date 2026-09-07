import type { Constructor } from '../Provider.js'

/**
 * A provider is loaded when a storage names it: the SDK one is written against is not paid
 * for by a process that declares another.
 */
export const providers = {
  s3: async () => (await import('./S3.js')).S3,
  spaces: async () => (await import('./Spaces.js')).Spaces,
  cloudinary: async () => (await import('./Cloudinary.js')).Cloudinary,
  fs: async () => (await import('./FileSystem.js')).FileSystem,
  tmp: async () => (await import('./Temporary.js')).Temporary,
  test: async () => (await import('./Test.js')).Test
} as const satisfies Record<string, () => Promise<Constructor>>

export type { Declaration } from './Declaration.js'

export type { S3Options } from './S3.js'
export type { SpacesOptions } from './Spaces.js'
export type { CloudinaryOptions } from './Cloudinary.js'
export type { FileSystemOptions } from './FileSystem.js'
export type { TemporaryOptions } from './Temporary.js'
export type { FileSystem, S3, Spaces, Cloudinary, Temporary } from './index.types.js'
