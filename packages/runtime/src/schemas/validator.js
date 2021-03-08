'use strict'

const { default: Ajv } = require('ajv')

const { extensions } = require('./extensions')

class Validator {
  #instance

  constructor () {
    this.#instance = new Ajv(OPTIONS)

    for (const extension of extensions) {
      if (extension.format) { this.#instance.addFormat(extension.name, extension.format) }
    }
  }

  add (schema) {
    if (schema.type && schema.type !== 'object') { throw new Error('Schemas must be an object type') }
    if (!schema.$id) { throw new Error('Schemas must contain unique $id') }

    this.#instance.addSchema({ ...DEFAULTS, ...schema })
  }

  validate (id, object, strict = true) {
    if (!strict && !this.#instance.getSchema(id)) { return }

    return this.#instance.validate(id, object)
  }

  defaults (id) {
    const schema = this.#instance.getSchema(id)?.schema

    if (!schema) { throw new Error(`Unknown schema '${id}'`) }

    const value = Object.fromEntries(Object.keys(schema.properties).map(key => [key, undefined]))

    this.#instance.validate(id, value)

    return value
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
const DEFAULTS = { type: 'object', additionalProperties: false }

exports.Validator = Validator
