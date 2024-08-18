import { Temporary, type TemporaryOptions } from './Temporary'
import type { Secret } from '../Secrets'

export class Test extends Temporary {
  public static override readonly SECRETS: readonly Secret[] = [
    { name: 'USERNAME' },
    { name: 'PASSWORD' }
  ]

  public constructor (options: TemporaryOptions) {
    super(options)
  }
}
