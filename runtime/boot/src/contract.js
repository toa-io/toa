'use strict'

const { contract: { Request, Reply } } = require('@toa.io/core')
const { Schema } = require('@toa.io/libraries.schema')

const request = (definition) => {
  const request = Request.schema(definition)
  const schema = new Schema(request)

  return new Request(schema)
}

const reply = (output, error) => {
  const reply = Reply.schema(output, error)
  const schema = new Schema(reply)

  return new Reply(schema)
}

exports.request = request
exports.reply = reply
