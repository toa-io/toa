import type { S3Options } from './S3.js'
import type { SpacesOptions } from './Spaces.js'
import type { CloudinaryOptions } from './Cloudinary.js'
import type { FileSystemOptions } from './FileSystem.js'
import type { TemporaryOptions } from './Temporary.js'

export type Declaration =
  ({ provider: 's3' } & S3Options)
  | ({ provider: 'spaces' } & SpacesOptions)
  | ({ provider: 'cloudinary' } & CloudinaryOptions)
  | ({ provider: 'fs' } & FileSystemOptions)
  | ({ provider: 'tmp' } & TemporaryOptions)
  | ({ provider: 'test' } & TemporaryOptions)
