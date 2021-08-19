'use strict'

const ast = {
  left: {
    type: 'SELECTOR',
    selector: 'id'
  },
  type: 'COMPARISON',
  operator: '==',
  right: {
    type: 'VALUE',
    value: 100500
  }
}

const criteria = {
  id: { $eq: 100500 }
}

exports.ast = ast
exports.criteria = criteria
