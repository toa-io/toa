'use strict'

const { difference, newid } = require('@toa.io/generic')
const { EntityContractException } = require('../exceptions')

class Entity {
  #schema
  #origin = null
  #state

  constructor (schema, argument) {
    this.#schema = schema

    if (typeof argument === 'object') {
      const object = structuredClone(argument)
      this.set(object)
      this.#origin = argument
    } else {
      const id = argument === undefined ? newid() : argument
      this.#init(id)
    }
  }

  get () {
    return this.#state
  }

  set (value) {
    const error = this.#schema.fit(value)

    if (error !== null)
      throw new EntityContractException(error)

    this.#set(value)
  }

  event () {
    return {
      origin: this.#origin,
      state: this.#state,
      changeset: this.#origin === null ? this.#state : difference(this.#origin, this.#state),
      trailers: this.#state._trailers
    }
  }

  #init (id) {
    const value = {
      ...this.#schema.defaults({ id }),
      _version: 0
    }

    this.#set(value)
  }

  #set (value) {
    if (!('_trailers' in value))
      Object.defineProperty(value, '_trailers', {
        writable: false,
        configurable: false,
        enumerable: false,
        value: {}
      })

    if (!('_created' in value))
      value._created = Date.now()

    if (this.#state !== undefined) {
      value._updated = Date.now()
      value._version++
    }

    this.#state = value
  }
}

exports.Entity = Entity
