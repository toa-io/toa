import { type Provider } from '../Provider'
import { FileSystem } from './FileSystem'
import { Temporary } from './Temporary'
import { Test } from './Test'

export const providers: Record<string, ProviderClass> = {
  'file:': FileSystem,
  'tmp:': Temporary,
  'test:': Test
}

export type ProviderClass =
  (new (url: URL, secrets: Record<string, string>) => Provider) & { SECRETS?: string[] }
