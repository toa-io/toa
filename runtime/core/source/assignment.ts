import { Operation } from './operation.ts'
import type { Store } from './operation.ts'
import type { Changeset } from './entities/changeset.ts'

export class Assignment extends Operation {
  protected override async acquire(store: Store): Promise<void> {
    const changeset = this.scope.changeset(store.request.query as any)

    store.scope = changeset
    store.state = changeset.get()
  }

  protected override async commit(store: Store): Promise<void> {
    const { scope, state, reply, request } = store

    if (reply.error !== undefined) return

    const changeset = scope as Changeset

    changeset.set(state)

    /*
     * The call carries the reply as it stands, which is empty where the algorithm named no
     * output — the storage fills it with the post-image it computes, because that is where the
     * post-image is known.
     */
    const output = await this.scope.apply(changeset, request.input, this.call(store))

    // assignment returns new state by default
    if (store.reply.output === undefined) store.reply.output = output
  }
}
