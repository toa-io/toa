import { Operation } from './operation.ts'
import type { Store } from './operation.ts'
import type { Entity } from './entities/entity.ts'

export class Observation extends Operation {
  /** an observation answers what it read, and writes none of it back */
  protected override projects: boolean = true

  protected override async run(store: Store): Promise<void> {
    const scope = store.scope as Entity | null

    if (
      scope === null ||
      (scope?.deleted === true && (store.request.query as any)?.options?.deleted !== true)
    )
      store.reply = null
    else await super.run(store)
  }
}
