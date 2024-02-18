import { Temporary, type TemporaryOptions } from './Temporary'
import type { ProviderSecret, ProviderSecrets } from '../Provider'

export class Test extends Temporary {
  public static override readonly SECRETS: readonly ProviderSecret[] = [
    { name: 'USERNAME' },
    { name: 'PASSWORD' }
  ]

  public constructor (options: TemporaryOptions, secrets?: ProviderSecrets) {
    super(options, secrets)
  }
}
