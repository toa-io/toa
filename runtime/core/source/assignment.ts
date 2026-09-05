import { Operation } from './operation.js'
import type { Store } from './operation.js'
import type { Changeset } from './entities/changeset.js'

export class Assignment extends Operation {
  protected override async acquire (store: Store): Promise<void> {
    const changeset = this.scope.changeset(store.request.query as any)

    store.scope = changeset
    store.state = changeset.get()
  }

  protected override async commit (store: Store): Promise<void> {
    const {
      scope,
      state,
      reply,
      request
    } = store

    if (reply.error !== undefined) return

    const changeset = scope as Changeset

    changeset.set(state)

    const output = await this.scope.apply(changeset, request.input)

    // assignment returns new state by default
    if (store.reply.output === undefined) {
      store.reply.output = output
    }
  }
}
