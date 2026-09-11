import { Operation } from './operation.ts'
import type { Store } from './operation.ts'

export class Unmanaged extends Operation {
  protected override async acquire(store: Store): Promise<void> {
    store.state = this.scope.storage.raw
  }
}
