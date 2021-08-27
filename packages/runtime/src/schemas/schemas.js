'use strict'

const path = require('path')

const { default: Ajv } = require('ajv')
const keywords = require('ajv-keywords')

const { Schema } = require('./schema')

class Schemas {
  #instance
  #schemas = []
  #map = {}

  constructor () {
    this.#instance = new Ajv({ useDefaults: true })
    this.#extend()
  }

  add (schema, key) {
    const instance = new Schema()

    this.#instance.addSchema(schema, key)
    this.#schemas.push({ id: schema.$id, instance })
    this.#map[schema.$id] = this.#map[key] = instance

    return instance
  }

  get = (id) => this.#map[id]

  /**
   * Compiles all schemas. Must be called before any method of Schema instances.
   * This method is required because schemas containing cross-references may be added in any order.
   */
  compile () {
    for (const { id, instance } of this.#schemas) {
      const validate = this.#instance.getSchema(id)

      validate.error = () => validate.errors &&
        this.#instance.errorsText(validate.errors, { dataVar: path.basename(id, '.schema.json') })

      instance.compile(validate)
    }
  }

  #extend () {
    keywords(this.#instance)
  }
}

exports.Schemas = Schemas
