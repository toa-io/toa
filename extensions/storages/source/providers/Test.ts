import { Temporary, type TemporaryOptions } from './Temporary.js'
import type { Secret } from '../Secrets.js'

export class Test extends Temporary {
  public static override readonly SECRETS: readonly Secret[] = [
    { name: 'USERNAME' },
    { name: 'PASSWORD' }
  ]

  public constructor (options: TemporaryOptions) {
    super(options)
  }
}
