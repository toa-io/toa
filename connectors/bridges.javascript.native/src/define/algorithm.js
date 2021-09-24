'use strict'

const parser = require('@babel/parser')

const parse = (algorithm) => {
  if (typeof algorithm !== 'function') throw new Error('Algorithm must export function')

  const ast = parser.parse(algorithm.toString())

  const { type, target } = node(ast.program.body[0])
  return { type, target }
}

function node (node) {
  if (node.type !== 'FunctionDeclaration') { throw new Error('Operation module must export named function declaration') }
  if (node.async !== true) { throw new Error('Operation module must export async function') }

  return { type: node.id.name, target: node.params[1]?.name }
}

exports.parse = parse
