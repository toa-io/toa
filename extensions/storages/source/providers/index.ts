import { FileSystem } from './FileSystem'
import { S3 } from './S3'
import { Cloudinary } from './Cloudinary'
import { Temporary } from './Temporary'
import { Test } from './Test'
import type { Constructor } from '../Provider'

export const providers = {
  s3: S3,
  cloudinary: Cloudinary,
  fs: FileSystem,
  tmp: Temporary,
  test: Test
} as const satisfies Record<string, Constructor>

export type { Declaration } from './Declaration'

export type { S3Options } from './S3'
export type { CloudinaryOptions } from './Cloudinary'
export type { FileSystemOptions } from './FileSystem'
export type { TemporaryOptions } from './Temporary'
