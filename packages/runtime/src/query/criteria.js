'use strict'

const { parse } = require('@rsql/parser')

const criteria = (criteria, schema) => {
  const ast = parse(criteria)

  if (schema) { coerce(ast, schema) }

  return ast
}

const coerce = (ast, schema) => {
  const values = traverse(ast)
  const value = values.reduce((acc, value) => (acc[value.name] = value.right.value) && acc, {})

  schema.fit(value)

  for (const { name, right } of values) {
    right.value = value[name]
  }
}

const traverse = (node, kv = []) => {
  if (node.type === 'COMPARISON') { kv.push({ name: node.left.selector, right: node.right }) }

  if (node.left) {
    traverse(node.left, kv)
    traverse(node.right, kv)
  }

  return kv
}

exports.criteria = criteria
