'use strict'

const path = require('path')
const glob = require('glob-promise')
const parser = require('@babel/parser')

const { yaml } = require('@kookaburra/gears')
const { dupes } = require('./validation')

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
  const { type, state } = node(ast.program.body[0])
  const declaration = { algorithm, name, type, state }

  const manifest = await yaml.try(`${path.resolve(path.dirname(file), path.basename(file, EXT))}.yaml`)
  const operation = { ...manifest, ...declaration }

  dupes(declaration, manifest, 'Function declaration and operation manifest')

  return operation
}

function node (node) {
  if (node.type !== 'FunctionDeclaration') { throw new Error('Algorithm must export named function declaration') }

  return { type: type(node), state: state(node) }
}

function type (node) {
  const type = node.id.name

  if (TYPES.indexOf(type) === -1) { throw new Error(`Algorithm name must be one of: ${TYPES.join(', ')}, ${type} given`) }

  return type
}

function state (node) {
  const param = node.params[1]?.name

  if (!param) return
  if (STATES.indexOf(param) === -1) throw new Error(`Algorithm state (second) argument name must be one of: ${STATES.join(', ')}`)

  return param
}

const TYPES = ['transition', 'observation']
const STATES = ['object', 'collection']

const EXT = '.js'

exports.parse = parse
