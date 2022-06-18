'use strict'

const boot = require('../..')

/**
 * @param {string} path
 * @returns {toa.core.extensions.Factory}
 */
const resolve = (path) => {
  if (instances[path] === undefined) instances[path] = create(path)

  return instances[path]
}

/**
 * @param {string} path
 * @returns {toa.core.extensions.Factory}
 */
const create = (path) => {
  const { Factory } = require(path)

  return new Factory(boot)
}

const instances = {}

exports.resolve = resolve
