'use strict'

const { Exception } = require('./exception')
const { defined } = require('@kookaburra/gears')

class Conditions {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  fit (value) {
    const error = this.#schema.fit(value)

    if (error) throw new Exception(this.constructor.EXCEPTION, error)
  }

  static EXCEPTION = Exception.SYSTEM

  static schema = (properties) => ({ properties: defined(properties) })
}

exports.Conditions = Conditions
