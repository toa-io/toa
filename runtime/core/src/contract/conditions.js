'use strict'

const { Exception } = require('../exception')

class Conditions {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  fit (value) {
    const error = this.#schema.fit(value)

    if (error !== null) throw new Exception(this.constructor.EXCEPTION, error)
  }

  static EXCEPTION = Exception.SYSTEM
}

exports.Conditions = Conditions
