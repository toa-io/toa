'use strict'

const { parse } = require('@rsql/parser')
const { QuerySyntaxException } = require('../exceptions')

const criteria = (criteria, properties) => {
  let ast

  try {
    ast = parse(criteria)
  } catch (e) {
    throw new QuerySyntaxException(e.message)
  }

  if (properties !== undefined) coerce(ast, properties)

  return ast
}

const coerce = (node, properties) => {
  if (node.type === 'COMPARISON' && node.left?.type === 'SELECTOR' && node.right?.type === 'VALUE') {
    const property = properties[node.left.selector]

    if (property === undefined) {
      throw new QuerySyntaxException(`Criteria selector '${node.left.selector}' is not defined`)
    }

    if (COERCE[property.type] !== undefined) { node.right.value = COERCE[property.type](node.right.value) }
  } else {
    if (node.left !== undefined) coerce(node.left, properties)
    if (node.right !== undefined) coerce(node.right, properties)
  }
}

const COERCE = {
  number: Number,
  integer: parseInt,
  boolean: Boolean
}

exports.criteria = criteria
