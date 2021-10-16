'use strict'

const parser = require('@babel/parser')
const { merge } = require('@toa.io/gears')

const definition = (module) => {
  const definition = {}

  if (typeof module.transition === 'function') definition.type = 'transition'
  if (typeof module.observation === 'function') definition.type = 'observation'

  if (definition.type === undefined) throw new Error('Operation must export either transition or observation function')

  const func = module[definition.type]
  const meta = parse(func)

  return merge(definition, meta)
}

const parse = (func) => {
  const ast = parser.parse(func.toString())

  return node(ast.program.body[0])
}

function node (node) {
  if (node.type === 'ExpressionStatement') node = node.expression
  if (node.async !== true) { throw new Error('Operation must export async function') }

  const result = {}

  if (node.params.length > 1) {
    const subject = node.params[1]?.name && SUBJECT[node.params[1].name]

    if (subject !== undefined) result.subject = subject
  }

  return result
}

const SUBJECT = {
  entry: 'entry',
  item: 'entry',
  entries: 'entries',
  items: 'entries',
  set: 'entries'
}

exports.definition = definition
