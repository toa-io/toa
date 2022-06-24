'use strict'

const { Schema } = require('@toa.io/libraries/schema')
const { Context } = require('./context')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  context (declaration) {
    const schema = new Schema(/** @type {toa.libraries.schema.JSON} */ declaration)

    return new Context(schema)
  }
}

exports.Factory = Factory
