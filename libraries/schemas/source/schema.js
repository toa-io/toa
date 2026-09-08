import { readFileSync, statSync } from 'node:fs'
import { yaml as jsyaml } from '@toa.io/generic'
import { create } from './validator.js'

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
    if (this.#validate(value)) return null
    else return this.#validate.errors[0]
  }

  validate(value, message) {
    if (this.#validate(value)) return

    if (message !== undefined) message += ': '

    throw new TypeError((message ?? '') + this.#validate.errors[0].message)
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
