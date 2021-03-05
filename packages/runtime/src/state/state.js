'use strict'

class State {
  #storage
  #entity

  constructor (storage, entity) {
    this.#storage = storage
    this.#entity = entity
  }

  async object (query) {
    const object = await this.#storage.get(query)

    return this.#entity.create(object)
  }

  async collection (query) {
    const collection = await this.#storage.find(query)

    // noinspection JSUnresolvedFunction
    return collection.map(object => this.#entity.create(object))
  }

  async commit (entity) {
    await this.#storage.upsert(entity)
  }
}

exports.State = State
