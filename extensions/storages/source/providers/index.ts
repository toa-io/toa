import { type Provider } from '../Provider'
import { FileSystem } from './FileSystem'
import { Temporary } from './Temporary'

export const providers: Record<string, new (...args: any[]) => Provider> = {
  'file:': FileSystem,
  'tmp:': Temporary
}
