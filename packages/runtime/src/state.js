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
    const object = query && (await this.#storage.get(query))

    return this.#entity.create(object)
  }

  async collection (query) {
    const collection = await this.#storage.find(query)

    // noinspection JSUnresolvedFunction
    return collection.map(object => this.#entity.create(object))
  }

  async commit (state) {
    if (!Array.isArray(state)) { state = [state] }

    state = state.map(entity => entity._construct())

    this.#storage.persist(state)
  }
}

exports.State = State
