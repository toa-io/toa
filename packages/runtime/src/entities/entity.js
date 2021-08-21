'use strict'

class Entity {
  #schema
  #state

  blank = false

  constructor (schema, argument) {
    this.#schema = schema

    if (typeof argument === 'string') {
      this.blank = true
      this.#state = { id: argument, ...this.#schema.defaults() }
    }

    if (typeof argument === 'object') this.state = argument
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
