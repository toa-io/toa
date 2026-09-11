import { packages } from '@toa.io/definitions/extensions.storages'
import type { Constructor } from '../Provider.ts'

/**
 * A provider is loaded when a storage names it: the SDK one is written against is not paid
 * for by a process that declares another, and is not installed by one either — it is an
 * optional peer of this package, which a deploy installs for the storages a component
 * declares. See `provider` below for what a workspace that has not gets told.
 */
export const providers = {
  s3: async () => (await import('./S3.ts')).S3,
  spaces: async () => (await import('./Spaces.ts')).Spaces,
  cloudinary: async () => (await import('./Cloudinary.ts')).Cloudinary,
  fs: async () => (await import('./FileSystem.ts')).FileSystem,
  tmp: async () => (await import('./Temporary.ts')).Temporary,
  test: async () => (await import('./Test.ts')).Test
} as const satisfies Record<string, () => Promise<Constructor>>

export type Id = keyof typeof providers

/** The provider a declaration names, or what to install to have it. */
export async function provider(id: Id): Promise<Constructor> {
  try {
    return await providers[id]()
  } catch (error) {
    const missing = Object.entries(packages[id]).map(
      ([name, version]) => `${name}@${version}`
    )

    if (missing.length === 0 || !isMissingModule(error)) throw error

    throw new Error(
      `Storage provider '${id}' needs ${missing.join(' ')}, which is not installed. ` +
        `\`toa npm\` installs what this context's components declare.`,
      { cause: error }
    )
  }
}

function isMissingModule(error: unknown): boolean {
  return (error as { code?: string })?.code === 'ERR_MODULE_NOT_FOUND'
}

export type { Declaration } from './Declaration.ts'

export type { S3Options } from './S3.ts'
export type { SpacesOptions } from './Spaces.ts'
export type { CloudinaryOptions } from './Cloudinary.ts'
export type { FileSystemOptions } from './FileSystem.ts'
export type { TemporaryOptions } from './Temporary.ts'
export type { FileSystem, S3, Spaces, Cloudinary, Temporary } from './index.types.ts'
