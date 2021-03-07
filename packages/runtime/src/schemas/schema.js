'use strict'

class Schema {
  #id
  #validator

  constructor (id, validator) {
    this.#id = id
    this.#validator = validator
  }

  get error () {
    return this.#validator.error()
  }

  get errors () {
    return this.#validator.errors
  }

  fit (value) {
    return this.#validator.validate(this.#id, value)
  }

  defaults () {
    return this.#validator.defaults(this.#id)
  }

  proxy (object) {
    return new Proxy(object, {
      set: (target, key, value) => {
        const valid = this.#validator.validate(`${this.#id}#/properties/${key}`, value)
        if (!valid) { throw new Error(this.#validator.error(key)) }

        target[key] = value

        return true
      }
    })
  }
}

exports.Schema = Schema
