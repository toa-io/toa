import { Connector } from '@toa.io/core'
import { console } from 'openspan'

/**
 * The explorer process. It hosts the introspection components — the map is read
 * through their own operations — and serves the UI.
 */
export class Explorer extends Connector {
  protected override async open (): Promise<void> {
    console.info('Introspection explorer started')
  }

  protected override dispose (): void {
    console.info('Introspection explorer is closed')
  }
}
