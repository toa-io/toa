'use strict'

const { default: Ajv } = require('ajv')
const keywords = require('ajv-keywords')

class Schema {
  #validate

  constructor (schema) {
    const validator = new Ajv(OPTIONS)

    keywords(validator)

    this.#validate = validator.compile(schema)
  }

  fit (value) {
    const valid = this.#validate(value)

    if (valid) { return null } else { return this.#error() }
  }

  defaults () {
    const defaults = {}

    this.#validate(defaults)

    return defaults
  }

  #error () {
    const error = this.#validate.errors[0]

    const result = {
      message: error.message,
      keyword: error.keyword
    }

    if (error.dataPath) {
      result.property = error.dataPath.replace(/\//g, '.')
      result.message = result.property + ' ' + result.message
    } else if (error.keyword === 'required') result.property = error.params.missingProperty
    else if (error.keyword === 'additionalProperties') result.property = error.params.additionalProperty

    return result
  }
}

const OPTIONS = { useDefaults: true, strictTypes: false }

exports.Schema = Schema
