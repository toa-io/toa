import { Temporary, type TemporaryOptions } from './Temporary'
import type { ProviderSecret } from '../Provider'

export class Test extends Temporary {
  public static override readonly SECRETS: readonly ProviderSecret[] = [
    { name: 'USERNAME' },
    { name: 'PASSWORD' }
  ]

  public constructor (props: TemporaryOptions) {
    super(props)
  }
}
