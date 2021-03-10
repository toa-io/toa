'use strict'

const { default: Ajv } = require('ajv')
const patch = require('ajv-merge-patch/keywords/patch')

const { extensions } = require('./extensions')

class Validator {
  #instance

  constructor () {
    this.#instance = new Ajv(OPTIONS)
    patch(this.#instance)

    for (const extension of extensions) {
      if (extension.format) { this.#instance.addFormat(extension.name, extension.format) }
    }
  }

  add (schema) {
    this.#instance.addSchema(schema)
  }

  /**
   * Creates new schema based on source without required and with intersecting properties without defaults
   *
   * @param id {string} Source schema ID
   * @param target {Object} Target schema (must have $id and properties)
   */
  constrained (id, target) {
    /*
    This whole story with query object validation including this method in this particular class
    looks too wired and complicated. A better solution required eventually.
     */
    const source = this.#instance.getSchema(id).schema
    const patches = []

    for (const property of Object.keys(source.properties)) {
      if (property in target.properties) {
        // patch property
        if (target.properties[property] !== null) {
          for (const [key, value] of Object.entries(target.properties[property])) {
            patches.push({ op: 'add', path: `/properties/${property}/${key}`, value })
          }
        }

        // remove default
        if ('default' in source.properties[property]) {
          patches.push({ op: 'remove', path: `/properties/${property}/default` })
        }
      } else {
        // remove properties difference
        patches.push({ op: 'remove', path: `/properties/${property}` })
      }
    }

    // remove required
    if ('required' in source) { patches.push({ op: 'remove', path: '/required' }) }
    if ('required' in target) { patches.push({ op: 'add', path: '/required', value: target.required }) }

    const patch = {
      $id: target.$id,
      $patch: {
        source: { $ref: id },
        with: patches
      }
    }

    return patch
  }

  validate (id, object, strict = true) {
    const schema = this.#instance.getSchema(id)

    if (!strict && !schema) { return }

    return this.#instance.validate(id, object)
  }

  defaults (id) {
    const schema = this.#instance.getSchema(id)?.schema

    if (!schema) { throw new Error(`Unknown schema '${id}'`) }

    const value = Object.fromEntries(Object.keys(schema.properties).map(key => [key, undefined]))

    this.#instance.validate(id, value)

    return value
  }

  error (key = 'object') {
    const errors = this.#instance.errors?.filter(error => error.keyword !== '$patch')
    return (errors && errors.length) ? this.#instance.errorsText(errors, { dataVar: key }) : null
  }

  get errors () {
    return this.#instance.errors?.map(Validator.#error).filter(error => error !== null) ?? null
  }

  static #error (error) {
    if (error.keyword === '$patch') { return null }

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

const OPTIONS = { useDefaults: true }

exports.Validator = Validator
