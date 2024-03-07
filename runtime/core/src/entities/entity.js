'use strict'

const {
  difference,
  newid
} = require('@toa.io/generic')

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

    if (error !== null) throw new EntityContractException(error)

    this.#set(value)
  }

  event () {
    return {
      origin: this.#origin,
      state: this.#state,
      changeset: this.#origin === null ? this.#state : difference(this.#origin, this.#state)
    }
  }

  #init (id) {
    const value = {
      ...this.#schema.defaults({ id }),
      _version: 0,
      _created: Date.now()
    }

    this.#set(value)
  }

  #set (value) {
    Object.defineProperty(value, 'id', {
      writable: false,
      configurable: false
    })

    if (this.#state !== undefined) {
      value._updated = Date.now()
      value._version++
    }

    this.#state = value
  }
}

exports.Entity = Entity
