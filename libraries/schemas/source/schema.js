import { defined } from '@toa.io/generic'
import { readFileSync, statSync } from 'node:fs'
import { yaml as jsyaml } from '@toa.io/generic'
import { create } from './validator.js'
import betterAjvErrors from 'better-ajv-errors'

export class Schema {
  id

  /** @type {import('ajv').ValidateFunction} */
  #validate

  /** @param {import('ajv').ValidateFunction} validate */
  constructor(validate) {
    this.id = validate.schema.$id
    this.#validate = validate
  }

  fit(value) {
    const valid = this.#validate(value)

    if (valid) return null
    else return this.#error(value)
  }

  validate(value, message) {
    const valid = this.#validate(value)

    if (!valid) {
      let error = betterAjvErrors(this.#validate.schema, value, this.#validate.errors, {
        format: 'js'
      })

      const text = error.length === 0 ? this.#validate.errors[0].message : error[0].error

      if (message !== undefined) message += ': '

      throw new TypeError((message ?? '') + text)
    }
  }

  #error = (value) => {
    const error = this.#validate.errors[0]
    let be = betterAjvErrors(this.#validate.schema, value, this.#validate.errors, {
      format: 'js'
    })

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
  if (typeof cos === 'string' && isFile(cos)) cos = jsyaml.load(readFileSync(cos, 'utf8'))

  return new Schema(create(cos, options))
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
