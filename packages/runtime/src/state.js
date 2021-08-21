'use strict'

class State {
  #storage
  #entity

  query

  constructor (storage, entity) {
    this.#storage = storage
    this.#entity = entity
  }

  async object (query) {
    if (!query) { return this.#entity.blank() }

    const entry = await this.#storage.get(query)

    return this.#entity.create(entry)
  }

  async collection (query) {
    const entries = await this.#storage.find(query)

    return this.#entity.set(entries)
  }

  async commit (object) {
    const method = object.blank ? 'add' : 'update'

    await this.#storage[method](object.state)
  }
}

exports.State = State
