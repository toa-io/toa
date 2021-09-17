'use strict'

const { contract: { Request, Reply, Query } } = require('@kookaburra/core')
const { Schema } = require('@kookaburra/schema')

const request = (entity, descriptor) => {
  const request = Request.schema(descriptor)
  const schema = new Schema(request)
  const query = new Query(entity?.properties)

  return new Request(schema, query, descriptor)
}

const reply = (output, error) => {
  const reply = Reply.schema(output, error)
  const schema = new Schema(reply)

  return new Reply(schema)
}

exports.request = request
exports.reply = reply
