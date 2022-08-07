'use strict'

const { empty } = require('@toa.io/libraries/generic')

const {
  StatePreconditionException,
  StateNotFoundException,
  StateInitializationException
} = require('./exceptions')

class State {
  #storage
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

  async commit (subject) {
    const event = subject.event()

    let ok = true

    if (!empty(event.changeset)) {
      const values = subject.get()
      ok = await this.#storage.store(values)

      // TODO: do not wait because outbox will handle failures
      // TODO: handle slow emissions (too many concurrent emissions)
      // noinspection JSUnresolvedVariable
      if (global.TOA_INTEGRATION_OMIT_EMISSION !== true) {
        await this.#emitter.emit(event)
      }
    }

    return ok
  }

  async apply (subject) {
    const { changeset, insert } = subject.export()

    let upsert

    if (this.#initialized && subject.query.id !== undefined && subject.query.version === undefined) {
      upsert = insert
    }

    const state = await this.#storage.upsert(subject.query, changeset, upsert)

    if (state === null) {
      if (subject.query.version !== undefined) throw new StatePreconditionException()
      else throw new StateNotFoundException()
    }

    // TODO: same as above
    // noinspection JSUnresolvedVariable
    if (global.TOA_INTEGRATION_OMIT_EMISSION !== true) {
      await this.#emitter.emit({ changeset, state })
    }
  }
}

exports.State = State
