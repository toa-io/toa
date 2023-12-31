import { type Provider } from '../Provider'
import { FileSystem } from './FileSystem'
import { S3 } from './S3'
import { Temporary } from './Temporary'
import { Test } from './Test'

export const providers: Record<string, ProviderClass> = {
  'file:': FileSystem,
  'tmp:': Temporary,
  'test:': Test,
  's3:': S3,
  'https:': S3
}

export type ProviderClass =
  (new (url: URL, secrets: Record<string, string>) => Provider) & { SECRETS?: string[] }
