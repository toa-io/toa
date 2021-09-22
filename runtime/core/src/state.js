'use strict'

const { empty } = require('@kookaburra/gears')

class State {
  #storage
  #entity
  #emitter

  query

  constructor (storage, entity, emitter) {
    this.#storage = storage
    this.#entity = entity
    this.#emitter = emitter
  }

  init () {
    return this.#entity.init()
  }

  async entry (query) {
    const entry = await this.#storage.get(query)

    return entry ? this.#entity.entry(entry) : null
  }

  async entries (query) {
    const entries = await this.#storage.find(query)

    return entries.length ? this.#entity.entries(entries) : null
  }

  async commit (target) {
    const method = target.initial ? 'add' : 'update'
    const event = target.event()

    if (!empty(event.changeset)) {
      await this.#storage[method](target.get())

      // TODO: do not wait because outbox will handle failures
      await this.#emitter.emit(event)
    }
  }
}

exports.State = State
