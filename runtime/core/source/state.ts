import { EntitySet } from './entities/set.js'
import { StatePreconditionException, StateNotFoundException } from './exceptions.js'
import type { Readable } from 'node:stream'
import type { Factory } from './entities/factory.js'
import type { Entity } from './entities/entity.js'
import type { Changeset } from './entities/changeset.js'
import type { Outbox } from './outbox/outbox.js'
import type { Row } from './types/outbox.js'
import type { Query, Record, Storage } from './types/storages.js'

/**
 * What an operation acquires and commits. One method per scope a manifest may declare, which
 * is how an operation reaches the one it was declared with.
 */
export class State {
  public readonly storage: Storage

  readonly #entities: Factory
  readonly #outbox: Outbox | undefined

  /** whether an entity exists by virtue of the identity it is looked up by */
  readonly #associated: boolean

  // eslint-disable-next-line max-params
  public constructor (storage: Storage, entities: Factory, outbox: Outbox | undefined,
    associated?: boolean) {
    this.storage = storage

    this.#entities = entities
    this.#outbox = outbox
    this.#associated = associated === true
  }

  public init (id?: string): Entity {
    return this.#entities.init(id)
  }

  public fit (values: object): void {
    this.#entities.fit(values)
  }

  /** scope `object` */
  public async object (query: Query, mutable = true): Promise<Entity | null> {
    const record = await this.storage.get(query)

    if (record !== null)
      return this.#entities.object(record, mutable)

    // an associated entity is whatever the identity it is looked up by names, so a miss on
    // that identity alone is a blank rather than an absence
    if (this.#associated && query.id !== undefined &&
      query.criteria === undefined && query.version === undefined)
      return this.init(query.id)

    if (query.version !== undefined)
      throw new StatePreconditionException()

    return null
  }

  /** scope `objects` */
  public async objects (query: Query, mutable = true): Promise<EntitySet> {
    const recordset = await this.storage.find(query)
    const ids = query.ids

    const missing = this.#associated && ids !== undefined && recordset.length < ids.length

    const init = missing
      ? ids.filter((id) => !recordset.some((record) => record.id === id))
      : undefined

    return this.#entities.objects(recordset, init, mutable)
  }

  /** scope `stream` */
  public async stream (query: Query): Promise<Readable> {
    return this.storage.stream(query)
  }

  /** scope `changeset` */
  public changeset (query: Query): Changeset {
    return this.#entities.changeset(query)
  }

  /** scope `none`: an operation that acquires nothing still asks for its scope */
  public none (): null {
    return null
  }

  /** get-or-create, in one indivisible step */
  public async ensure (query: Query | undefined, properties: object,
    input?: object): Promise<Entity> {
    const object = this.#entities.init()
    const blank = object.get()

    Object.assign(blank, properties)
    object.set(blank)

    const row = this.#outbox?.row(object.event(input))
    const record = await this.storage.ensure(query, properties, object.get(), row)

    // whatever came back under another id was already there, and an effect never commits it
    if (record.id !== blank.id)
      return this.#entities.object(record, NOT_MUTABLE)

    await this.#publish(row)

    return object
  }

  public async commit (state: Entity | EntitySet, input?: object): Promise<boolean> {
    if (state instanceof EntitySet)
      return this.massCommit(state, input)

    // the row is built before the write so that the storage can commit it in the same
    // transaction, closing the window this used to have
    const row = this.#outbox?.row(state.event(input))
    const ok = await this.storage.store(state.get(), row)

    if (ok) await this.#publish(row)

    return ok
  }

  public async massCommit (state: EntitySet, input?: object): Promise<boolean> {
    const outbox = this.#outbox

    const rows = outbox === undefined
      ? undefined
      : state.events(input).map((event) => outbox.row(event))

    const ok = await this.storage.massStore(state.get(), rows)

    if (ok && rows !== undefined)
      await Promise.all(rows.map(async (row) => this.#publish(row)))

    return ok
  }

  public async apply (state: Changeset, input?: object): Promise<Record> {
    // an assignment's images are the write's own, so the storage fills them in
    const row = this.#outbox?.row({ input })
    const result = await this.storage.upsert(state.query, state.export(), row)

    if (result === null)
      throw state.query.version === undefined
        ? new StateNotFoundException()
        : new StatePreconditionException()

    if (row !== undefined) {
      // a storage that does not know how leaves the event with what it was given
      row.event.state ??= result
      row.event.origin ??= null

      await this.#publish(row)
    }

    return result
  }

  /**
   * Without a durable outbox this is the emission itself, and the operation waits for it;
   * with one the row is already committed and this returns at once.
   */
  async #publish (row: Row | undefined): Promise<void> {
    if (row !== undefined) await this.#outbox?.publish(row)
  }
}

/** an effect never commits what `ensure` hands it, see `Effect` */
const NOT_MUTABLE = false
