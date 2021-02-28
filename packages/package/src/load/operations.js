'use strict'

const path = require('path')
const glob = require('glob-promise')
const parser = require('@babel/parser')

const { yaml, console } = require('@kookaburra/gears')

const operations = async (dir, manifests) => {
  const files = await glob(path.resolve(dir, `*${EXT}`))
  const operations = await Promise.all(files.map(operation(manifests)))

  return operations
}

const operation = (operations) => async (file) => {
  const name = path.parse(file).name

  delete require.cache[require.resolve(file)]

  const algorithm = require(file)
  const ast = parser.parse(algorithm.toString())
  const { type, state } = node(ast.program.body[0])
  const declaration = { algorithm, name, type, state }

  const manifest = await yaml.try(`${path.resolve(path.dirname(file), path.basename(file, EXT))}.yaml`)

  dupes(declaration, manifest)

  const operation = { ...manifest, ...declaration }
  const existent = operations.find(operation => operation.name === name)

  if (existent) {
    dupes(declaration, existent)
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

  if (STATES.indexOf(param) === -1) {
    throw new Error(`Algorithm state (second) argument name must be one of: ${STATES.join(', ')}`)
  }

  return param
}

function dupes (a, b) {
  if (!b) return

  Object.keys(a).forEach(key => {
    if (key === 'name') return

    if (key in b) {
      if (a[key] !== b[key]) {
        throw new Error(`Conflicting multiple declaration of '${key}' for operation '${a.name}'`)
      }

      console.warn(`Multiple declaration of '${key}' for operation '${a.name}'`)
    }
  })
}

const TYPES = ['transition', 'observation']
const STATES = ['object', 'collection']

const EXT = '.js'

exports.operations = operations
