'use strict'

const { default: Ajv } = require('ajv/dist/2019')
const formats = /** @type {(Ajv) => void} */ require('ajv-formats')

const { definitions } = require('./definitions')
const { keywords } = require('./keywrods')

const validator = new Ajv({ useDefaults: true, strictTypes: false, coerceTypes: true })

formats(validator)
keywords(validator)
definitions(validator)

/**
 * @implements {toa.libraries.schema.Schema}
 */
class Schema {
  /**
   * @type {toa.libraries.schema.JSON}
   * @readonly
   */
  schema

  #validate
  #defaults
  #match
  #system

  /**
   * @param {toa.libraries.schema.JSON} schema
   */
  constructor (schema) {
    this.schema = schema
    this.#validate = validator.compile(schema)

    if (schema.properties !== undefined) this.#recompile(schema)
  }

  fit (value) {
    const valid = this.#validate(value)

    if (valid) return null
    else return this.#error()
  }

  validate (value) {
    const valid = this.#validate(value)

    if (!valid) this.#throw()
  }

  match (value) {
    const valid = this.#match(value)

    if (valid) return null
    else return this.#error()
  }

  defaults (value = {}) {
    this.#defaults(value)

    return value
  }

  system () {
    const value = {}

    this.#system(value)

    return value
  }

  /**
   * @param {toa.libraries.schema.JSON} schema
   */
  #recompile (schema) {
    const { required, $id, ...defaults } = schema
    const system = { ...defaults, properties: {} }
    const match = { ...defaults, properties: {} }

    if ($id !== undefined) {
      defaults.$id = $id + '_defaults'
      system.$id = $id + '_system'
      match.$id = $id + '_match'
    }

    this.#defaults = validator.compile(defaults)

    for (const [key, value] of Object.entries(schema.properties)) {
      const { ...copy } = value

      delete copy.default

      if (value.system === true) system.properties[key] = copy

      match.properties[key] = copy
    }

    this.#system = validator.compile(system)
    this.#match = validator.compile(match)
  }

  /**
   * @returns {toa.libraries.schema.Error}
   */
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
      result.message = error.instancePath.substring(1) + ' ' +
        result.message.replace('properties', 'property') + ` '${result.property}'`
    } else if (error.keyword === 'enum') {
      result.property = error.instancePath.substring(1)
      result.message += ` (${error.params.allowedValues.join(', ')})`
    } else if (error.instancePath) {
      result.property = error.instancePath.substring(1)
      result.message = result.property + ' ' + result.message

      if (error.keyword === 'const') result.message += ` '${error.params.allowedValue}'`
    } else if (error.keyword === 'required') result.property = error.params.missingProperty

    return result
  }

  /**
   * @throws {TypeError}
   */
  #throw () {
    const error = this.#error()

    throw new TypeError(error.message)
  }
}

exports.Schema = Schema
