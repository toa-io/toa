'use strict'

const { Query } = require('./query')
const { Range } = require('./range')
const { Concat } = require('./concat')

exports.Query = Query

exports.constraints = {
  criteria: Concat,
  sort: Concat,
  omit: Range,
  limit: Range
}
