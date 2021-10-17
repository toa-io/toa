'use strict'

const { SystemException } = require('../exceptions')

class Conditions {
  #schema

  constructor (schema) {
    this.#schema = schema
  }

  fit (value) {
    const error = this.#schema.fit(value)

    if (error !== null) throw new this.constructor.Exception(error)
  }

  static Exception = SystemException
}

exports.Conditions = Conditions
