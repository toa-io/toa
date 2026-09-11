import { Temporary, type TemporaryOptions } from './Temporary.ts'
import { secrets } from '@toa.io/definitions/extensions.storages'
import type { Secret } from '../Secrets.ts'

export class Test extends Temporary {
  public static override readonly SECRETS: readonly Secret[] = secrets.test

  public constructor(options: TemporaryOptions) {
    super(options)
  }
}
