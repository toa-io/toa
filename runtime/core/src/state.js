'use strict'

class State {
  #storage
  #entity

  query

  constructor (storage, entity) {
    this.#storage = storage
    this.#entity = entity
  }

  async entry (query) {
    if (!query) return this.#entity.blank()

    const entry = await this.#storage.get(query)

    return this.#entity.entry(entry)
  }

  async set (query) {
    const entries = await this.#storage.find(query)

    return this.#entity.set(entries)
  }

  async commit (target) {
    const method = target.blank ? 'add' : 'update'

    await this.#storage[method](target.get())
  }
}

exports.State = State
