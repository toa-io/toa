import { type Provider } from '../Provider'
import { Filesystem } from './Filesystem'

export const providers: Record<string, new (...args: any[]) => Provider> = {
  'file:': Filesystem
}
