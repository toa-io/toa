'use strict'

const path = require('path')
const glob = require('glob-promise')
const parser = require('@babel/parser')

const { yaml } = require('@kookaburra/gears')

const TYPES = ['transition', 'observation']
const STATES = ['object', 'collection']

const operation = (operations) => async (file) => {
  delete require.cache[require.resolve(file)]

  const algorithm = require(file)
  const manifest = await yaml.try(`${path.resolve(path.dirname(file), path.basename(file, EXT))}.yaml`)
  const name = path.parse(file).name

  const ast = parser.parse(algorithm.toString())
  const { type, state } = node(ast.program.body[0])

  const operation = { algorithm, name, type, state, ...manifest }
  const existent = operations.find(operation => operation.name === name)

  if (existent) {
    Object.assign(existent, operation)
  } else {
    operations.push(operation)
  }
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

  if (STATES.indexOf(param) === -1) { throw new Error(`Algorithm state (second) argument name must be one of: ${STATES.join(', ')}`) }

  return param
}

const operations = async (dir, manifests) => {
  const files = await glob(path.resolve(dir, `*${EXT}`))
  const operations = await Promise.all(files.map(operation(manifests)))

  return operations
}

const EXT = '.js'

exports.operations = operations
