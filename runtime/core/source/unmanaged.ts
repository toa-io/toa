import { Operation } from './operation.js'
import type { Store } from './operation.js'

export class Unmanaged extends Operation {
  protected override async acquire (store: Store): Promise<void> {
    store.state = this.scope.storage.raw
  }
}
