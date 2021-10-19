'use strict'

const { default: Ajv } = require('ajv/dist/2019')

const { definitions } = require('./definitions')
const { keywords } = require('./keywrods')

const validator = new Ajv({ useDefaults: true, strictTypes: false, coerceTypes: true })

keywords(validator)
definitions(validator)

class Schema {
  #schema
  #validate
  #defaults

  constructor (schema) {
    this.#schema = schema
    this.#validate = validator.compile(schema)

    if (schema.properties !== undefined) {
      const { required, $id, ...defaults } = schema

      if ($id !== undefined) defaults.$id = $id + ':defaults'

      this.#defaults = validator.compile(defaults)
    }
  }

  fit (value) {
    const valid = this.#validate(value)

    if (valid) return null
    else return this.#error()
  }

  defaults (value = {}) {
    this.#defaults(value)

    return value
  }

  #error () {
    const error = this.#validate.errors[0]

    const result = {
      message: error.message,
      keyword: error.keyword
    }

    if (error.schemaPath) result.schema = error.schemaPath
    if (error.instancePath) result.path = error.instancePath

    if (error.keyword === 'additionalProperties') {
      result.property = error.params.additionalProperty
      result.message = error.instancePath.substr(1) + ' ' +
        result.message.replace('properties', 'property') + ` '${result.property}'`
    } else if (error.instancePath) {
      result.property = error.instancePath.substr(1)
      result.message = result.property + ' ' + result.message

      if (error.keyword === 'const') result.message += ` '${error.params.allowedValue}'`
    } else {
      if (error.keyword === 'required') result.property = error.params.missingProperty
    }

    return result
  }
}

exports.Schema = Schema
