'use strict'

const { empty } = require('@kookaburra/gears')

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

    if (entry === null && query.id !== undefined && this.#initialized) return this.init(query.id)

    return entry === null ? null : this.#entity.entry(entry)
  }

  async entries (query) {
    const entries = await this.#storage.find(query)

    return entries.length ? this.#entity.entries(entries) : null
  }

  async commit (subject) {
    const method = subject.initial ? 'add' : 'update'
    const event = subject.event()

    if (!empty(event.changeset)) {
      await this.#storage[method](subject.get())

      // TODO: do not wait because outbox will handle failures
      // TODO: handle slow emissions (too many concurrent emissions)
      await this.#emitter.emit(event)
    }
  }
}

exports.State = State
