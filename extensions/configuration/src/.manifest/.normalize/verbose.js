'use strict'

const { remap } = require('@toa.io/libraries/generic')

const verbose = (node) => {
  const isObject = node.properties !== undefined
  const isValue = node.type !== undefined && node.type !== 'object'
  const isProperties = node[SYM] === 1

  if (!isObject && !isValue && !isProperties) return convert(node)

  return node
}

const convert = (node) => {
  const properties = remap(node, property)

  properties[SYM] = 1

  return { type: 'object', properties, additionalProperties: false }
}

function property (node) {
  if (node === null) throw new Error('Configuration: cannot resolve type of null, use JSONSchema declaration.')

  const type = Array.isArray(node) ? 'array' : typeof node

  if (type === 'object') return node
  if (type === 'array') return array(node)

  return { type, default: node }
}

const array = (array) => {
  if (array.length === 0) throw new Error('Configuration: cannot resolve concise array items type because it\'s empty')

  const type = typeof array[0]

  return {
    type: 'array',
    items: { type },
    default: array
  }
}

const SYM = Symbol()

exports.verbose = verbose
