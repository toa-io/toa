'use strict'

const { StatePreconditionException, StateNotFoundException } = require('./exceptions')

class State {
  storage

  #associated
  #entities
  #outbox

  constructor (storage, entity, outbox, associated) {
    this.storage = storage
    this.#entities = entity
    this.#outbox = outbox
    this.#associated = associated === true
  }

  init (id) {
    return this.#entities.init(id)
  }

  fit (values) {
    return this.#entities.fit(values)
  }

  async object (query, mutable = true) {
    const record = await this.storage.get(query)

    if (record === null) {
      if (this.#associated && query.id !== undefined && query.criteria === undefined && query.version === undefined)
        return this.init(query.id)
      else if (query.version !== undefined)
        throw new StatePreconditionException()

      return null
    } else
      return this.#entities.object(record, mutable)
  }

  async objects (query, mutable = true) {
    const recordset = await this.storage.find(query)
    const missing = this.#associated && query.ids !== undefined && recordset.length < query.ids.length
    const init = missing ? query.ids.filter((id) => !recordset.some((record) => record.id === id)) : undefined
    
    return this.#entities.objects(recordset, init, mutable)
  }

  async stream (query) {
    return this.storage.stream(query)
  }

  changeset (query) {
    return this.#entities.changeset(query)
  }

  none () {
    return null
  }

  async ensure (query, properties, input) {
    const object = this.#entities.init()
    const blank = object.get()

    Object.assign(blank, properties)

    object.set(blank)

    const row = this.#outbox?.row(object.event(input))
    const record = await this.storage.ensure(query, properties, object.get(), row)

    if (record.id !== blank.id) // exists
      return this.#entities.object(record, NOT_MUTABLE)

    if (row !== undefined)
      await this.#outbox.publish(row)

    return object
  }

  async commit (state, input) {
    if (state.constructor.name === 'EntitySet') 
      return this.massCommit(state, input)

    const data = state.get()

    // the row is built before the write so that the storage can commit it in the same
    // transaction, closing the window this used to have
    const row = this.#outbox?.row(state.event(input))
    const ok = await this.storage.store(data, row)

    if (ok === true && row !== undefined)
      await this.#outbox.publish(row)

    return ok
  }

  async massCommit (state, input) {
    const data = state.get()
    const rows = this.#outbox === undefined
      ? undefined
      : state.events(input).map((event) => this.#outbox.row(event))

    const ok = await this.storage.massStore(data, rows)

    if (ok === true && rows !== undefined)
      await Promise.all(rows.map((row) => this.#outbox.publish(row)))

    return ok
  }

  async apply (state, input) {
    const changeset = state.export()

    // an assignment's event is the write's own images, so the storage fills them in;
    // see `apply` in the outbox design
    const row = this.#outbox?.row({ input })
    const result = await this.storage.upsert(state.query, changeset, row)

    if (result === null) {
      if (state.query.version !== undefined) {
        throw new StatePreconditionException()
      } else {
        throw new StateNotFoundException()
      }
    } else if (row !== undefined) {
      // the storage fills `origin` and `state` from its own write; a storage that does not
      // know how leaves the event with what it was given
      row.event.state ??= result
      row.event.origin ??= null

      await this.#outbox.publish(row)
    }

    return result
  }
}

/** an effect never commits what `ensure` hands it, see `Effect` */
const NOT_MUTABLE = false

exports.State = State
