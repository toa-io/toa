'use strict'

const { Query } = require('./query')
const { Range } = require('./range')
const { Criteria } = require('./criteria')
const { Enum } = require('./enum')
const { Sort } = require('./sort')

exports.Query = Query

exports.constraints = {
  criteria: Criteria,
  sort: Sort,
  omit: Range,
  limit: Range,
  projection: Enum
}
