import { type Provider } from '../Provider'
import { FileSystem } from './FileSystem'
import { S3 } from './S3'
import { Temporary } from './Temporary'

export const providers: Record<string, new (...args: any[]) => Provider> = {
  'file:': FileSystem,
  'tmp:': Temporary,
  's3:': S3
}
