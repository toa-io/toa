'use strict'

const { contract: { Request, Reply } } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const request = (entity, definition) => {
  const request = Request.schema(definition)
  const schema = new Schema(request)

  return new Request(schema, definition)
}

const reply = (output, error) => {
  const reply = Reply.schema(output, error)
  const schema = new Schema(reply)

  return new Reply(schema)
}

exports.request = request
exports.reply = reply
