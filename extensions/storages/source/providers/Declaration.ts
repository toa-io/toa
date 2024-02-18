import type { S3Options } from './S3'
import type { FileSystemOptions } from './FileSystem'
import type { TemporaryOptions } from './Temporary'

export type Declaration =
  ({ provider: 's3' } & S3Options)
  | ({ provider: 'fs' } & FileSystemOptions)
  | ({ provider: 'tmp' } & TemporaryOptions)
  | ({ provider: 'mem' })
  | ({ provider: 'test' } & TemporaryOptions)
