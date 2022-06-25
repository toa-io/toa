'use strict'

const clone = require('clone-deep')
const { traverse, merge } = require('@toa.io/libraries/generic')

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.extensions.configuration.Provider}
 */
class Provider extends Connector {
  /** @type {toa.libraries.schema.Schema} */
  #schema

  /** @type {string} */
  #key
  /** @type {Object} */
  #object
  /** @type {Object} */
  #form
  /** @type {Object} */
  #value

  source

  /**
   * @param {toa.core.Locator} locator
   * @param {toa.libraries.schema.Schema} schema
   */
  constructor (locator, schema) {
    super()

    this.source = this.#source.bind(this)

    this.#key = PREFIX + locator.uppercase
    this.#schema = schema
    this.#form = structure(schema.schema)
  }

  async connection () {
    const form = clone(this.#form)
    const string = process.env[this.#key]
    const value = string === undefined ? {} : JSON.parse(string)
    const object = merge(form, value, { override: true })

    this.#schema.validate(object)

    this.#value = value
    this.#object = object
  }

  #source = () => {
    return this.#object
  }
}

/**
 * @param {toa.libraries.schema.JSON} schema
 * @return {Object}
 */
const structure = (schema) => {
  const defaults = (node) => {
    if (node.properties !== undefined) return { ...node.properties }
    if (node.default !== undefined) return node.default

    return null
  }

  return traverse(schema, defaults)
}

const PREFIX = 'TOA_CONFIGURATION_'

exports.Provider = Provider
