'use strict'

const path = require('path')

const { yaml } = require('@kookaburra/gears')

const schema = yaml.sync(path.resolve(__dirname, './error.yaml'))

const codes = {
  INTERNAL: 0,
  // user codes: 1-99

  INVALID_INPUT: 101,
  INVALID_QUERY: 102,

  NOT_FOUND: 201,
  DUPLICATE_KEY: 202,

  INVALID_OUTPUT: 301,
  INVALID_ERROR: 302
}

const literal = Object.fromEntries(Object.entries(codes)
  .map(([literal, code]) => [code, literal]))

codes.resolve = (code) => literal[code]

exports.schema = schema
exports.codes = codes
