'use strict'

const { expand } = require('@toa.io/concise')
const { defined } = require('@toa.io/generic')
const { file } = require('@toa.io/filesystem')
const yaml = require('@toa.io/yaml')
const { create, is } = require('./validator')
const betterAjvErrors = require('better-ajv-errors').default

/**
 * @implements {toa.schemas.Schema}
 */
class Schema {
  /** @type {string} */
  id

  #validate

  /**
   * @param {import('ajv').ValidateFunction} validate
   */
  constructor (validate) {
    this.id = validate.schema.$id
    this.#validate = validate
  }

  fit (value) {
    const valid = this.#validate(value)

    if (valid) return null
    else return this.#error()
  }

  validate (value) {
    const valid = this.#validate(value)

    if (!valid) {
      let error = betterAjvErrors(this.#validate.schema, value, this.#validate.errors, { format: 'js' })

      if (error.length === 0)
        throw new Error(this.#validate.errors[0].message)

      throw new TypeError(error[0].error)
    }
  }

  #error = () => {
    const error = this.#validate.errors[0]

    const mapped = {
      message: error.message,
      keyword: error.keyword,
      property: error.propertyName,
      path: error.instancePath,
      schema: error.schemaPath,
      params: error.params
    }

    return defined(mapped)
  }
}

/** @type {toa.schemas.constructors.schema} */
const schema = (cos) => {
  if (typeof cos === 'string' && file.is.sync(cos)) cos = yaml.load.sync(cos)

  const validator = create()
  const schema = expand(cos, is)
  const validate = validator.compile(schema)

  return new Schema(validate)
}

exports.Schema = Schema
exports.schema = schema
