'use strict'

const { empty } = require('@toa.io/libraries/generic')

const {
  StatePreconditionException,
  StateNotFoundException,
  StateInitializationException
} = require('./exceptions')

/**
 * @implements {toa.core.State}
 */
class State {
  #storage

  /** @type {toa.core.entity.Factory} */
  #entity
  #emitter
  #initialized

  constructor (storage, entity, emitter, initialized) {
    this.#storage = storage
    this.#entity = entity
    this.#emitter = emitter
    this.#initialized = initialized
  }

  init (id) {
    if (this.#initialized === true && id === undefined) {
      throw new StateInitializationException('Cannot initialize entity which is initialized. Use request.query.id to access.')
    }

    return this.#entity.init(id)
  }

  async object (query) {
    const record = await this.#storage.get(query)

    if (record === null) {
      if (this.#initialized && query.id !== undefined && query.version === undefined) return this.init(query.id)
      else if (query.version !== undefined) throw new StatePreconditionException()
      else throw new StateNotFoundException()
    }

    return this.#entity.object(record)
  }

  async objects (query) {
    const recordset = await this.#storage.find(query)

    return this.#entity.objects(recordset)
  }

  changeset (query) {
    return this.#entity.changeset(query)
  }

  async commit (state) {
    const event = state.event()

    let ok = true

    if (!empty(event.changeset)) {
      const object = state.get()

      ok = await this.#storage.store(object)

      // TODO: do not wait because outbox will handle failures
      // TODO: handle slow emissions (too many concurrent emissions)
      // noinspection JSUnresolvedVariable
      if (global.TOA_INTEGRATION_OMIT_EMISSION !== true) {
        await this.#emitter.emit(event)
      }
    }

    return ok
  }

  async apply (state) {
    const { changeset, insert } = state.export()

    let upsert

    if (this.#initialized && state.query.id !== undefined && state.query.version === undefined) {
      upsert = insert
    }

    const result = await this.#storage.upsert(state.query, changeset, upsert)

    if (result === null) {
      if (state.query.version !== undefined) throw new StatePreconditionException()
      else throw new StateNotFoundException()
    }

    // TODO: same as above
    // noinspection JSUnresolvedVariable
    if (global.TOA_INTEGRATION_OMIT_EMISSION !== true) {
      await this.#emitter.emit({ changeset, state: result })
    }
  }
}

exports.State = State
