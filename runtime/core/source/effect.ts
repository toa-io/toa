import { Observation } from './observation.ts'
import type { Store } from './operation.ts'
import type { Entity } from './entities/entity.ts'

export class Effect extends Observation {
  /** an effect reads for what it does next, which a projected read would leave short */
  protected override projects: boolean = false

  protected override async acquire(store: Store): Promise<void> {
    const { query, entity, input } = store.request

    if (entity === undefined) return super.acquire(store)

    store.scope = await this.scope.ensure(query as any, entity, input)
    store.state = (store.scope as Entity).get()
  }
}
