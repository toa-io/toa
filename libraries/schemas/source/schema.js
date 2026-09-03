import { defined } from '@toa.io/generic'
import { readFileSync, statSync } from 'node:fs'
import * as jsyaml from 'js-yaml'
import { create, is, ajv } from './validator.js'
import { debug } from 'node:util'
import betterAjvErrors from 'better-ajv-errors'

export class Schema {
  id

  /** @type {import('ajv').ValidateFunction} */
  #validate

  /** @type {import('ajv').ValidateFunction} */
  #validateOptional

  /** @type {import('ajv').ValidateFunction} */
  #match

  /** @type {(() => import('ajv').ValidateFunction) | undefined} */
  #compileOptional

  /** @type {(() => import('ajv').ValidateFunction) | undefined} */
  #compileMatch

  /**
   * The optional and matching variants are compiled on demand: most schemas are
   * only ever validated as a whole, and compilation is what boot time is spent on.
   *
   * @param {import('ajv').ValidateFunction} validate
   * @param {() => import('ajv').ValidateFunction} [compileOptional]
   * @param {() => import('ajv').ValidateFunction} [compileMatch]
   */
  constructor (validate, compileOptional, compileMatch) {
    this.id = validate.schema.$id
    this.#validate = validate
    this.#compileOptional = compileOptional
    this.#compileMatch = compileMatch
  }

  get #optional () {
    if (this.#validateOptional === undefined)
      this.#validateOptional = this.#compileOptional?.()

    return this.#validateOptional
  }

  get #matching () {
    if (this.#match === undefined)
      this.#match = this.#compileMatch?.()

    return this.#match
  }

  fit (value, validate = this.#validate) {
    const valid = validate(value)

    if (valid) return null
    else return this.#error(value)
  }

  fitOptional (value) {
    const validate = this.#optional

    if (validate === undefined)
      throw new Error('Optional schema is not defined')

    return this.fit(value, validate)
  }

  match (value) {
    const validate = this.#matching

    if (validate === undefined)
      throw new Error('Matching schema is not defined')

    return this.fit(value, validate)
  }

  validate (value, message) {
    const valid = this.#validate(value)

    if (!valid) {
      let error = betterAjvErrors(this.#validate.schema, value, this.#validate.errors, { format: 'js' })

      const text = error.length === 0
        ? this.#validate.errors[0].message
        : error[0].error

      if (message !== undefined)
        message += ': '

      throw new TypeError((message ?? '') + text)
    }
  }

  #error = (value) => {
    const error = this.#validate.errors[0]
    let be = betterAjvErrors(this.#validate.schema, value, this.#validate.errors, { format: 'js' })

    const mapped = {
      message: be[0].error.trim(),
      keyword: error.keyword,
      property: error.propertyName,
      path: error.instancePath,
      schema: error.schemaPath,
      params: error.params
    }

    return defined(mapped)
  }
}

export const schema = (cos, options) => {
  if (typeof cos === 'string' && isFile(cos))
    cos = jsyaml.load(readFileSync(cos, 'utf8'))

  const schema = cos
  const validate = create(schema, options)

  let compileOptional
  let compileMatch

  if (schema.type === 'object') {
    const { required, ...optional } = schema

    compileOptional = () => create(optional)
    compileMatch = () => create(optional, { useDefaults: false })
  }

  return new Schema(validate, compileOptional, compileMatch)
}

/**
 * @param {string} path
 * @returns {boolean}
 */
const isFile = (path) => {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}
