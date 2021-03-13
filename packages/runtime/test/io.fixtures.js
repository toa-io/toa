'use strict'

const randomstring = require('randomstring')

const schema = () => ({
  fit: jest.fn(input => ({ ok: !input?.invalid, oh: input?.invalid ? { message: 'error' } : undefined })),
  defaults: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() }))
})

const schemas = {
  input: schema(),
  output: schema(),
  error: schema()
}

exports.schemas = schemas
