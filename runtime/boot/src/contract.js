'use strict'

const { contract: { Request, Reply } } = require('@toa.io/core')
const schemas = require('@toa.io/schemas')

const request = (definition, entity) => {
  const request = Request.schema(definition, entity)
  const schema = schemas.schema(request)

  return new Request(schema, definition)
}

const reply = (output, errors) => {
  const reply = Reply.schema(output, errors)
  const schema = schemas.schema(reply)

  return new Reply(schema)
}

exports.request = request
exports.reply = reply
