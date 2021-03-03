'use strict'

const Ajv = require('ajv')

class Schema {
  #validate

  constructor (schema) {
    if (schema.type && schema.type !== 'object') { throw new Error('State/input schemas must be object type') }

    const Ctor = Ajv.default // avoid code style errors
    const ajv = new Ctor(OPTIONS)

    this.#validate = ajv.compile({ ...DEFAULTS, ...schema })
  }

  fit (object) {
    const ok = this.#validate(object)

    return { ok, errors: this.#validate.errors?.map(Schema.#error) }
  }

  static #error (error) {
    const result = {
      keyword: error.keyword,
      property: undefined,
      message: error.message
    }

    if (error.dataPath) {
      result.property = error.dataPath.slice(1)
    } else if (error.keyword === 'required') {
      result.property = error.params.missingProperty
    } else if (error.keyword === 'additionalProperties') {
      result.property = error.params.additionalProperty
    }

    return result
  }
}

const DEFAULTS = { type: 'object', additionalProperties: false }
const OPTIONS = { useDefaults: true }

exports.Schema = Schema
