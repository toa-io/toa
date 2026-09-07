import { Temporary, type TemporaryOptions } from './Temporary.js'
import { secrets } from './secrets.js'
import type { Secret } from '../Secrets.js'

export class Test extends Temporary {
  public static override readonly SECRETS: readonly Secret[] = secrets.test

  public constructor(options: TemporaryOptions) {
    super(options)
  }
}
