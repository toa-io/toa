'use strict'

const { join } = require('node:path')

/**
 * @param {string} path
 * @returns {{ metadata: object, module: object }}
 */
function load (path) {
  const metadata = loadMetadata(path)
  const module = loadModule(path)

  return { metadata, module }
}

function loadMetadata (reference) {
  reference = join(reference, 'package.json')

  try {
    return require(reference)
  } catch {
    return null
  }
}

/**
 * @param {string} reference
 * @returns {object}
 */
function loadModule (reference) {
  const path = require.resolve(reference)

  return require(path)
}

exports.load = load
