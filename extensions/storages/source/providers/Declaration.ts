import type { S3Options } from './S3.ts'
import type { SpacesOptions } from './Spaces.ts'
import type { CloudinaryOptions } from './Cloudinary.ts'
import type { FileSystemOptions } from './FileSystem.ts'
import type { TemporaryOptions } from './Temporary.ts'

export type Declaration =
  | ({ provider: 's3' } & S3Options)
  | ({ provider: 'spaces' } & SpacesOptions)
  | ({ provider: 'cloudinary' } & CloudinaryOptions)
  | ({ provider: 'fs' } & FileSystemOptions)
  | ({ provider: 'tmp' } & TemporaryOptions)
  | ({ provider: 'test' } & TemporaryOptions)
