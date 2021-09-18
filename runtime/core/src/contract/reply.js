'use strict'

const { Conditions } = require('./conditions')
const { Exception } = require('../exception')

class Reply extends Conditions {
  static EXCEPTION = Exception.POSTCONDITION

  static schema (output, error) {
    const schema = { properties: {} }

    if (output) schema.properties.output = output
    if (error) schema.properties.error = error

    return schema
  }
}

exports.Reply = Reply
