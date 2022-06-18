'use strict'

const { merge } = require('@toa.io/gears')

/**
 * @param {toa.storages.mongo.Annotations | string} declaration
 * @returns {toa.storages.mongo.Annotations}
 */
const normalize = (declaration) => {
  if (typeof declaration === 'string') declaration = { default: declaration }
  if (typeof declaration !== 'object' || declaration === null) throw new TypeError('Wrong format of storages.mongodb annotations')

  keys(declaration)
  values(declaration)

  return declaration
}

/**
 * @param {toa.storages.mongo.annotations.Node} node
 * @returns {void}
 */
const values = (node) => {
  for (const [key, val] of Object.entries(node)) {
    if (typeof val === 'string') node[key] = value(val)
    else values(val)
  }
}

/**
 * @param {toa.storages.mongo.annotations.Node} node
 * @returns {void}
 */
const keys = (node) => {
  for (const [key, value] of Object.entries(node)) {
    if (key.includes('.')) {
      const [left, right] = key.split('.')

      if (typeof value !== 'string') keys(value)

      node[left] = merge(node[left], { [right]: value })
    }
  }
}

/**
 * @param {string} value
 * @returns {string}
 */
const value = (value) => {
  if (!value.includes('://')) return 'mongodb://' + value

  return value
}

exports.normalize = normalize
