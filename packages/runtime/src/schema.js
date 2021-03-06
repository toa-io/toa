'use strict'

const { Validator } = require('./schema/validator')

class Schema {
  #validator
  #schema

  constructor (schema) {
    if (schema.type && schema.type !== 'object') { throw new Error('Entity/Input schemas must be object type') }

    this.#schema = { ...DEFAULTS, ...schema }
    this.#validator = new Validator(this.#schema)
  }

  get error () {
    return this.#validator.error()
  }

  get errors () {
    return this.#validator.errors
  }

  fit (object) {
    return this.#validator.validate(this.#schema, object)
  }

  defaults () {
    const { required, ...schema } = this.#schema
    const value = {}

    this.#validator.validate(schema, value)

    return value
  }

  proxy (object) {
    return new Proxy(object, {
      set: (target, key, value) => {
        let valid

        if (key in this.#schema.properties) {
          valid = this.#validator.validate(`#/properties/${key}`, value)
          if (!valid) { throw new Error(this.#validator.error(key)) }
        }

        target[key] = value

        return true
      }
    })
  }
}

const DEFAULTS = { type: 'object', additionalProperties: false }

exports.Schema = Schema
