'use strict'

const { parse } = require('@rsql/parser')

const criteria = (criteria, properties) => {
  const ast = parse(criteria)

  if (properties) coerce(ast, properties)

  return ast
}

const coerce = (node, properties) => {
  if (node.type === 'COMPARISON' && node.left?.type === 'SELECTOR' && node.right?.type === 'VALUE') {
    const property = properties[node.left.selector]

    if (!property) throw new Error(`criteria selector '${node.left.selector}' is not allowed`)

    if (COERCE[property.type]) { node.right.value = COERCE[property.type](node.right.value) }
  } else {
    if (node.left) coerce(node.left, properties)
    if (node.right) coerce(node.right, properties)
  }
}

const COERCE = {
  number: Number,
  boolean: Boolean
}

exports.criteria = criteria
