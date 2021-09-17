'use strict'

class State {
  #storage
  #entity

  query

  constructor (storage, entity) {
    this.#storage = storage
    this.#entity = entity
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

    await this.#storage[method](target.get())
  }
}

exports.State = State
