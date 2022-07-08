'use strict'

const { merge } = require('@toa.io/libraries/generic')

/**
 * @param {toa.annotations.URIs | string} declaration
 * @returns {toa.annotations.URIs}
 */
const normalize = (declaration) => {
  /** @type {toa.annotations.URIs} */
  let annotation

  if (typeof declaration === 'string') annotation = { default: declaration }
  else annotation = declaration

  if (typeof annotation !== 'object' || annotation === null) throw new TypeError('Wrong format of storages.mongodb annotations')

  keys(annotation)
  values(annotation)

  return annotation
}

/**
 * @param {toa.storages.mongo.annotations.Node} node
 * @returns {void}
 */
const values = (node) => {
  for (const [key, val] of Object.entries(node)) {
    if (typeof val === 'string') node[key] = val
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

exports.normalize = normalize
