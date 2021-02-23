'use strict'

const Ajv = require('ajv')

module.exports = class Schema {
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
    const valid = this.#validate(object)

    return valid
  }
}
