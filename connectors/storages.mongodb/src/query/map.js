'use strict'

const LOGIC = {
  and: '$and',
  ';': '$and',
  or: '$or',
  ',': '$or'
}

const COMPARISON = {
  '==': '$eq',
  '>': '$gt',
  '>=': '$gte',
  '=in=': '$in',
  '<': '$lt',
  '<=': '$lte',
  '!=': '$ne',
  '=out=': '$nin'
}

exports.LOGIC = LOGIC
exports.COMPARISON = COMPARISON
