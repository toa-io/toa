'use strict'

const { empty } = require('@toa.io/gears')

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
      throw new StateInitializationException('Entity is initialized')
    }

    return this.#entity.init(id)
  }

  async entry (query) {
    const entry = await this.#storage.get(query)

    if (entry === null) {
      if (this.#initialized && query.id !== undefined && query.version === undefined) return this.init(query.id)
      else if (query.version !== undefined) throw new StatePreconditionException()
      else throw new StateNotFoundException()
    }

    return this.#entity.entry(entry)
  }

  async list (query) {
    const entries = await this.#storage.find(query)

    return this.#entity.list(entries)
  }

  changeset (query) {
    return this.#entity.changeset(query)
  }

  async commit (subject) {
    const event = subject.event()

    let ok = true

    if (!empty(event.changeset)) {
      ok = await this.#storage.store(subject.get())

      // TODO: do not wait because outbox will handle failures
      // TODO: handle slow emissions (too many concurrent emissions)
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
    if (global.TOA_INTEGRATION_OMIT_EMISSION !== true) {
      await this.#emitter.emit({ changeset, state })
    }
  }
}

exports.State = State
