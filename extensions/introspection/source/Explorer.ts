import { Connector } from '@toa.io/core'
import { console } from 'openspan'

/**
 * The explorer process. It hosts the introspection components and nothing else:
 * the map is read through their own operations.
 */
export class Explorer extends Connector {
  protected override async open (): Promise<void> {
    console.info('Introspection explorer started')
  }

  protected override dispose (): void {
    console.info('Introspection explorer is closed')
  }
}
