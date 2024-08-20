import type { S3Options } from './S3'
import type { CloudinaryOptions } from './Cloudinary'
import type { FileSystemOptions } from './FileSystem'
import type { TemporaryOptions } from './Temporary'

export type Declaration =
  ({ provider: 's3' } & S3Options)
  | ({ provider: 'cloudinary' } & CloudinaryOptions)
  | ({ provider: 'fs' } & FileSystemOptions)
  | ({ provider: 'tmp' } & TemporaryOptions)
  | ({ provider: 'test' } & TemporaryOptions)
