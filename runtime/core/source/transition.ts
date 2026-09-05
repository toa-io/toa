import { retry } from '@toa.io/generic'
import { Operation } from './operation.js'
import { StateConcurrencyException, StateNotFoundException } from './exceptions.js'
import type { Contracts, Definition, Store } from './operation.js'
import type { Cascade } from './cascade.js'
import type { State } from './state.js'
import type { Query as Translator } from './query.js'
import type { Entity } from './entities/entity.js'

export class Transition extends Operation {
  /** a transition is the only operation that commits */
  protected override mutable = true

  readonly #concurrency: string | undefined

  // eslint-disable-next-line max-params
  public constructor (cascade: Cascade, scope: State, contract: Contracts,
    query: Translator, definition: Definition) {
    super(cascade, scope, contract, query, definition)

    this.#concurrency = definition.concurrency
  }

  protected override async process (store: Store): Promise<any> {
    return retry(async (retry) => this.#retry(store, retry), RETRY)
  }

  protected override async acquire (store: Store): Promise<void> {
    const { request } = store

    store.scope = request.query === undefined
      ? this.scope.init()
      : await this.query(request.query)

    const entity = store.scope as Entity | null

    if (entity === null || (entity.deleted &&
      (request.query as any)?.options?.deleted !== true))
      throw new StateNotFoundException()

    store.state = entity.get()
  }

  protected override async commit (store: Store): Promise<void> {
    const { scope, state, reply, retry } = store

    if (reply.error !== undefined) return

    const entity = scope as Entity

    entity.set(state)

    const result = await this.scope.commit(entity, store.request.input)

    if (result === false) {
      if (this.#concurrency === 'retry')
        await retry?.()
      else
        throw new StateConcurrencyException()
    }
  }

  async #retry (store: Store, retry: () => Promise<any>): Promise<any> {
    store.retry = retry

    return super.process(store)
  }
}

const RETRY = {
  base: 10,
  max: 5000,
  dispersion: 1,
  retries: 32
}
