'use strict'

class Entity {
  #system
  #schema

  constructor (value, schema) {
    Object.assign(this, this.#destruct(value))

    this.#schema = schema
    this.#extend()
  }

  #extend () {
    Object.defineProperty(this, '_construct', {
      configurable: false,
      writable: false,
      enumerable: false,
      value: () => this.#construct()
    })
  }

  #destruct (value) {
    const { _created, _updated, _deleted, _version, ...rest } = value

    this.#system = { _created, _updated, _deleted, _version }

    return rest
  }

  #construct () {
    const value = { ...this, ...this.#system }

    const { ok, oh } = this.#schema.fit(value)

    if (!ok) throw new Error(oh.message)

    return value
  }
}

exports.Entity = Entity
