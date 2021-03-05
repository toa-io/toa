'use strict'

const Ajv = require('ajv')

class Schema {
  #ajv
  #validate

  constructor (schema) {
    if (schema.type && schema.type !== 'object') { throw new Error('Entity/Input schemas must be object type') }

    const Ctor = Ajv.default // avoid code style errors
    this.#ajv = new Ctor(OPTIONS)
    this.#validate = this.#ajv.compile({ ...DEFAULTS, ...schema })
  }

  get error () {
    return this.#validate.errors && this.#ajv.errorsText(this.#validate.errors, { dataVar: 'object' })
  }

  get errors () {
    return this.#validate.errors?.map(Schema.#error) ?? null
  }

  fit (object) {
    return this.#validate(object)
  }

  proxy (object) {
    return new Proxy(object, {
      set: (target, key, value) => {
        let valid

        try {
          valid = this.#ajv.validate(`#/properties/${key}`, value)
        } catch (e) {
          throw new Error(`Entity schema does not contain property '${key}'`)
        }

        if (!valid) { throw new Error(this.#ajv.errorsText(this.#ajv.errors, { dataVar: key })) }

        target[key] = value

        return true
      }
    })
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

const DEFAULTS = { type: 'object', additionalProperties: false }
const OPTIONS = { useDefaults: true }

exports.Schema = Schema
