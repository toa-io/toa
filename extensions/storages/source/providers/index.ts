import { FileSystem } from './FileSystem.js'
import { S3 } from './S3.js'
import { Spaces } from './Spaces.js'
import { Cloudinary } from './Cloudinary.js'
import { Temporary } from './Temporary.js'
import { Test } from './Test.js'
import type { Constructor } from '../Provider.js'

export const providers = {
  s3: S3,
  spaces: Spaces,
  cloudinary: Cloudinary,
  fs: FileSystem,
  tmp: Temporary,
  test: Test
} as const satisfies Record<string, Constructor>

export type { Declaration } from './Declaration.js'

export type { S3Options } from './S3.js'
export type { SpacesOptions } from './Spaces.js'
export type { CloudinaryOptions } from './Cloudinary.js'
export type { FileSystemOptions } from './FileSystem.js'
export type { TemporaryOptions } from './Temporary.js'
export type { FileSystem, S3, Spaces, Cloudinary, Temporary }
