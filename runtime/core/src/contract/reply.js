'use strict'

const schemas = require('./schemas')
const { Contract } = require('./contract')
const { ResponseContractException } = require('../exceptions')

class Reply extends Contract {
  static Exception = ResponseContractException

  /**
   * @returns {toa.schema.JSON}
   */
  static schema (output, error) {
    const schema = { type: 'object', properties: {}, additionalProperties: false }

    if (output !== undefined)
      schema.properties.output = output

    if (error !== undefined)
      schema.properties.error = error
    else
      schema.properties.error = schemas.error

    return schema
  }
}

exports.Reply = Reply
