'use strict'

const path = require('path')
const glob = require('glob-promise')
const parser = require('@babel/parser')

const { yaml } = require('@kookaburra/gears')
const { dupes } = require('./validate')

const parse = async (dir) => {
  const files = await glob(path.resolve(dir, `*${EXT}`))
  const operations = await Promise.all(files.map(operation))

  return operations
}

const operation = async (file) => {
  const name = path.parse(file).name

  delete require.cache[require.resolve(file)]

  const algorithm = require(file)
  const ast = parser.parse(algorithm.toString())
  const { type, target } = node(ast.program.body[0])
  const declaration = { algorithm, name, type, target }

  const manifest = await yaml.try(`${path.resolve(path.dirname(file), path.basename(file, EXT))}.yaml`)
  const operation = { ...manifest, ...declaration }

  dupes(declaration, manifest, 'Function declaration and operation manifest')

  return operation
}

function node (node) {
  if (node.type !== 'FunctionDeclaration') { throw new Error('Algorithm must export named function declaration') }

  return { type: type(node), target: target(node) }
}

function type (node) {
  const type = node.id.name

  if (TYPES.indexOf(type) === -1) { throw new Error(`Algorithm name must be one of: ${TYPES.join(', ')}, ${type} given`) }

  return type
}

function target (node) {
  const param = node.params[1]?.name

  if (!param) return
  if (TARGETS.indexOf(param) === -1) throw new Error(`Algorithm target (second) argument name must be one of: ${TARGETS.join(', ')}`)

  return param
}

const TYPES = ['transition', 'observation']
const TARGETS = ['object', 'collection']

const EXT = '.js'

exports.parse = parse
