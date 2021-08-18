'use strict'

class Entity {
  #schema
  #state

  blank = false

  constructor (schema, id) {
    this.#schema = schema

    if (id) {
      this.blank = true
      this.#state = { _id: id, ...this.#schema.defaults() }
    }
  }

  get state () {
    return this.#state
  }

  set state (value) {
    const { ok, oh } = this.#schema.fit(value)

    if (!ok) throw new Error(`Value doesn't match entity schema (${oh.message})`)

    this.#state = value
  }
}

exports.Entity = Entity
