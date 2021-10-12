'use strict'

const { empty } = require('@kookaburra/gears')
const { Exception } = require('./exception')

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
    return this.#entity.init(id)
  }

  async entry (query) {
    const entry = await this.#storage.get(query)

    if (entry === null) {
      if (this.#initialized && query.id !== undefined && query.version === undefined) return this.init(query.id)
      else throw new Exception(Exception.STORAGE_MISSED)
    }

    return this.#entity.entry(entry)
  }

  async entries (query) {
    const entries = await this.#storage.find(query)

    return this.#entity.entries(entries)
  }

  async commit (subject) {
    const event = subject.event()

    let ok = true

    if (!empty(event.changeset)) {
      ok = await this.#storage.store(subject.get())

      // TODO: do not wait because outbox will handle failures
      // TODO: handle slow emissions (too many concurrent emissions)
      await this.#emitter.emit(event)
    }

    return ok
  }
}

exports.State = State
