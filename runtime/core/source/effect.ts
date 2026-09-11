import { Observation } from './observation.ts'
import type { Store } from './operation.ts'
import type { Entity } from './entities/entity.ts'

export class Effect extends Observation {
  protected override async acquire(store: Store): Promise<void> {
    const { query, entity, input } = store.request

    if (entity === undefined) return super.acquire(store)

    store.scope = await this.scope.ensure(query as any, entity, input)
    store.state = (store.scope as Entity).get()
  }
}
