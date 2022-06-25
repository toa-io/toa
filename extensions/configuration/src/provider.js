'use strict'

const clone = require('clone-deep')
const { merge } = require('@toa.io/libraries/generic')

const { Connector } = require('@toa.io/core')
const { form } = require('./.provider/form')

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
    this.#form = form(schema.schema)
  }

  async connection () {
    await this.#retrieve()
  }

  #source = () => {
    return this.#object
  }

  async set (key, value) {
    const object = clone(this.#object)
    const properties = key.split('.')
    const property = properties.pop()

    let cursor = object
    let target = this.#value

    for (const name of properties) {
      if (cursor[name] === undefined) cursor[name] = {}
      if (target[name] === undefined) target[name] = {}

      cursor = cursor[name]
      target = target[name]
    }

    cursor[property] = value

    this.#schema.validate(object)

    target[property] = value

    await this.#store()
  }

  async #retrieve () {
    const form = clone(this.#form)
    const string = process.env[this.#key]
    const value = string === undefined ? {} : JSON.parse(string)
    const object = merge(form, value, { override: true })

    this.#schema.validate(object)

    this.#value = value
    this.#object = object
  }

  async #store () {
    process.env[this.#key] = JSON.stringify(this.#value)
  }
}

const PREFIX = 'TOA_CONFIGURATION_'

exports.Provider = Provider
