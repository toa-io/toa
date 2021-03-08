'use strict'

class State {
  #storage
  #entity

  /**
   * reference to .object() or .collection()
   * assigned by boot depending on operation's target type
   *
   * @type function
   * @return {Entity | Array<Entity>}
   */
  query

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

  async commit (state) {
    this.#storage.persist(state)
  }
}

exports.State = State
