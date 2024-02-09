import { FileSystem } from './FileSystem'
import { S3 } from './S3'
import { Temporary } from './Temporary'
import { Test } from './Test'
import { InMemory } from './Memory'
import type { ProviderConstructor } from '../Provider'

export const providers = {
  fs: FileSystem,
  tmp: Temporary,
  test: Test,
  s3: S3,
  memory: InMemory
} as const satisfies Record<string, ProviderConstructor>
