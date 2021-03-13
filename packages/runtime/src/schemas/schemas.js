'use strict'

const path = require('path')

const { default: Ajv } = require('ajv')

const { extensions } = require('./extensions')
const { Schema } = require('./schema')
const { Null } = require('./null')

class Schemas {
  #instance
  #schemas = []
  #map = {}

  constructor () {
    this.#instance = new Ajv(OPTIONS)
    this.#extend()
  }

  add (schema, key) {
    if (schema === null) { return new Null() }

    const instance = new Schema()

    this.#instance.addSchema(schema, key)
    this.#schemas.push({ id: schema.$id, instance })
    this.#map[schema.$id] = instance

    if (key) { this.#map[key] = instance }

    return instance
  }

  get (id) {
    return this.#map[id]
  }

  /**
   * Compiles all schemas. Must be called before any method of Schema instances.
   * This method is required because schemas containing cross-references may be added in any order.
   */
  compile () {
    for (const { id, instance } of this.#schemas) {
      const validate = this.#instance.getSchema(id)

      validate.errorText = () => validate.errors &&
        this.#instance.errorsText(validate.errors, { dataVar: path.basename(id, '.schema.json') })

      instance.compile(validate)
    }
  }

  #extend () {
    for (const extension of extensions) {
      if (extension.format) { this.#instance.addFormat(extension.name, extension.format) }
    }
  }
}

const OPTIONS = { useDefaults: true }

exports.Schemas = Schemas
