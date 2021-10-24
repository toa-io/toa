'use strict'

const parser = require('@babel/parser')
const { merge } = require('@toa.io/gears')

const definition = (module) => {
  const definition = {}

  if (typeof module.transition === 'function') definition.type = 'transition'
  if (typeof module.observation === 'function') definition.type = 'observation'
  if (typeof module.assignment === 'function') definition.type = 'assignment'

  if (definition.type === undefined) {
    throw new Error('Operation must export either transition, observation or assignment function')
  }

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

  if (node.params.length > 1) result.subject = node.params[1]?.name && SUBJECT[node.params[1].name]

  return result
}

const SUBJECT = {
  entry: 'entry',
  item: 'entry',
  entries: 'entries',
  items: 'entries',
  set: 'entries',
  changeset: 'changeset'
}

exports.definition = definition
