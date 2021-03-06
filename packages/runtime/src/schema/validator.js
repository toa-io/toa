'use strict'

const { default: Ajv } = require('ajv')

class Validator {
  #instance

  constructor (schema) {
    this.#instance = new Ajv(OPTIONS)
    this.#instance.addSchema(schema) // compile?
  }

  validate (schema, object) {
    return this.#instance.validate(schema, object)
  }

  error (key = 'object') {
    return this.#instance.errors && this.#instance.errorsText(this.#instance.errors, { dataVar: key })
  }

  get errors () {
    return this.#instance.errors?.map(Validator.#error) ?? null
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

const OPTIONS = { useDefaults: true }

exports.Validator = Validator
