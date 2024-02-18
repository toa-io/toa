import { FileSystem } from './FileSystem'
import { S3 } from './S3'
import { Temporary } from './Temporary'
import { Test } from './Test'
import { InMemory } from './Memory'
import type { ProviderConstructor } from '../Provider'

export const providers = {
  s3: S3,
  fs: FileSystem,
  tmp: Temporary,
  mem: InMemory,
  test: Test
} as const satisfies Record<string, ProviderConstructor>

export type { Declaration } from './Declaration'
