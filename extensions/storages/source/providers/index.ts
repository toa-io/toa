import { type Provider } from '../Provider'
import { Filesystem } from './Filesystem'
import { Temporary } from './Temporary'

export const providers: Record<string, new (...args: any[]) => Provider> = {
  'file:': Filesystem,
  'tmp:': Temporary
}
