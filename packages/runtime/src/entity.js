'use strict'

class Factory {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  create (object) {
    const valid = this.#schema.fit(object)

    if (!valid) {
      throw new Error(`Storage object (#${object._id}) does not match Entity schema. Probably data is corrupted.\n` +
        `Schema errors: ${JSON.stringify(this.#schema.errors, null, 2)}'`)
    }

    return this.#schema.proxy(new Entity(object))
  }
}

class Entity {
  #id
  #created
  #deleted
  #version

  constructor (value) {
    const { _id, _created, _deleted, _version, ...rest } = value

    Object.defineProperty(this, '_id', {
      configurable: false,
      writable: false,
      enumerable: true,
      value: _id || Entity.#newID()
    })

    this.#created = _created
    this.#deleted = _deleted
    this.#version = _version

    Object.assign(this, rest)
  }

  get _id () { return this.#id }
  get _deleted () { return !!this.#deleted }

  set _deleted (value) {
    // undelete?
    if (value !== true) { throw new Error('Only true value can be set to Entity._deleted') }

    this.#deleted = true
  }

  static #newID () {
    // TODO: replace with identifier plugin
    return Math.floor(Math.random() * 1000000000000).toString()
  }
}

exports.Factory = Factory
