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

    const value = await this.#storage.get(query)

    return this.#entity.create(value)
  }

  async commit (object) {
    const method = object.blank ? 'add' : 'update'

    await this.#storage[method](object.state)
  }
}

exports.State = State
