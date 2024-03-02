'use strict'

const { empty } = require('@toa.io/generic')

const {
  StatePreconditionException,
  StateNotFoundException,
  StateInitializationException
} = require('./exceptions')

/**
 * @implements {toa.core.State}
 */
class State {
  /** @type {toa.core.Storage} */
  #storage

  /** @type {toa.core.entity.Factory} */
  #entity
  #emission
  #dependent

  constructor (storage, entity, emission, dependent) {
    this.#storage = storage
    this.#entity = entity
    this.#emission = emission
    this.#dependent = dependent === true
  }

  init (id) {
    return this.#entity.init(id)
  }

  async object (query) {
    const record = await this.#storage.get(query)

    if (record === null) {
      if (this.#dependent && query.id !== undefined && query.version === undefined) {
        return this.init(query.id)
      } else if (query.version !== undefined) throw new StatePreconditionException()
    }

    if (record === null) {
      return null
    } else {
      return this.#entity.object(record)
    }
  }

  async objects (query) {
    const recordset = await this.#storage.find(query)

    return this.#entity.objects(recordset)
  }

  changeset (query) {
    return this.#entity.changeset(query)
  }

  none () {
    return null
  }

  async commit (state) {
    const event = state.event()

    let ok = true

    if (!empty(event.changeset)) {
      const object = state.get()

      ok = await this.#storage.store(object)

      // #20
      await this.#emission.emit(event)
    }

    return ok
  }

  async apply (state) {
    const {
      changeset,
      insert
    } = state.export()

    let upsert

    if (this.#dependent && state.query.id !== undefined && state.query.version === undefined) {
      upsert = insert
    }

    const result = await this.#storage.upsert(state.query, changeset, upsert)

    if (result === null) {
      if (state.query.version !== undefined) {
        throw new StatePreconditionException()
      } else {
        throw new StateNotFoundException()
      }
    }

    // same as above
    await this.#emission.emit({
      changeset,
      state: result
    })

    return result
  }
}

exports.State = State
