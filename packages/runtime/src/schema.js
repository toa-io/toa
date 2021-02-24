'use strict'

const Ajv = require('ajv')

class Schema {
  static DEFAULTS = { type: 'object', additionalProperties: false }
  static OPTIONS = { useDefaults: true }

  #validate

  constructor (schema) {
    if (schema.type && schema.type !== 'object') { throw new Error('State/input schemas must be an object type') }

    const Ctor = Ajv.default // avoid code style errors
    const ajv = new Ctor(Schema.OPTIONS)
    const declaration = { ...Schema.DEFAULTS, ...schema }

    this.#validate = ajv.compile(declaration)
  }

  fit (object) {
    const ok = this.#validate(object)

    return { ok, errors: this.#validate.errors?.map(Schema.error) }
  }

  static error (error) {
    const result = {
      keyword: error.keyword,
      property: undefined,
      message: error.message,
      schemaPath: error.schemaPath
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

exports.Schema = Schema
