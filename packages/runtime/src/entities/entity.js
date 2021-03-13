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
    const value = () => this.#construct()

    Object.defineProperty(this, '_construct', {
      configurable: false,
      writable: false,
      enumerable: false,
      value
    })
  }

  #destruct (value) {
    const { _created, _updated, _deleted, _version, ...rest } = value

    this.#system = { _created, _updated, _deleted, _version }

    return rest
  }

  #construct () {
    const value = { ...this, ...this.#system }

    const ok = this.#schema.fit(value)

    // TODO: errors
    if (!ok) { return false } else { return value }
  }
}

exports.Entity = Entity
