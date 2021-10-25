'use strict'

const { Query } = require('./query')
const { OmitLimit } = require('./omitlimit')
const { OpenClose } = require('./openclose')

exports.Query = Query

exports.constraints = {
  criteria: OpenClose,
  sort: OpenClose,
  omit: OmitLimit,
  limit: OmitLimit
}
