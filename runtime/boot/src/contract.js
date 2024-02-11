'use strict'

const { contract: { Request, Reply } } = require('@toa.io/core')
const { Schema } = require('@toa.io/schema')

const request = (definition, entity) => {
  const request = Request.schema(definition, entity)
  const schema = new Schema(request, { removeAdditional: true }) // soft inputs

  return new Request(schema)
}

const reply = (output, error) => {
  const reply = Reply.schema(output, error)
  const schema = new Schema(reply) // outputs strict

  return new Reply(schema)
}

exports.request = request
exports.reply = reply
