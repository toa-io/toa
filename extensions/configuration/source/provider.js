'use strict'

const clone = require('clone-deep')
const { decode, encode, empty, overwrite, defaults } = require('@toa.io/generic')

const { Connector } = require('@toa.io/core')

const { secrets } = require('./secrets')
const { env } = require('./.provider')

/**
 * @implements {toa.extensions.configuration.Provider}
 */
class Provider extends Connector {
  /** @type {toa.schema.Schema} */
  #schema

  /** @type {Object} */
  #form
  /** @type {Object} */
  #value

  source
  object
  key

  /**
   * @param {toa.core.Locator} locator
   * @param {toa.schema.Schema} schema
   */
  constructor (locator, schema) {
    super()

    this.source = this.#source.bind(this)

    this.key = PREFIX + locator.uppercase
    this.#schema = schema

    // form is required to enable nested defaults
    this.#form = defaults(schema.schema)
  }

  async open () {
    this.#retrieve()
  }

  set (key, value) {
    const object = this.object === undefined ? {} : clone(this.object)
    const properties = key.split('.')
    const property = properties.pop()

    let cursor = object

    for (const name of properties) {
      if (cursor[name] === undefined) cursor[name] = {}

      cursor = cursor[name]
    }

    if (value === undefined) delete cursor[property]
    else cursor[property] = value

    this.#set(object)
  }

  unset (key) {
    this.set(key, undefined)
  }

  reset () {
    this.object = undefined
  }

  export () {
    return this.object === undefined ? undefined : encode(this.object)
  }

  #source () {
    return this.#value
  }

  #retrieve () {
    const string = process.env[this.key]
    const object = string === undefined ? {} : decode(string)

    this.#set(object)
  }

  #set (object) {
    object = this.#reveal(object)
    object = env(object)

    this.#merge(object)

    this.object = empty(object) ? undefined : object
  }

  #merge (object) {
    object = clone(object)

    const form = clone(this.#form)
    const value = overwrite(form, object)

    this.#schema.validate(value)
    this.#value = value
  }

  #reveal (object) {
    return secrets(object, (variable) => {
      if (!(variable in process.env)) throw new Error(`Configuration secret value ${variable} is not set`)

      const base64 = process.env[variable]

      return decode(base64)
    })
  }
}

const PREFIX = 'TOA_CONFIGURATION_'

exports.Provider = Provider
