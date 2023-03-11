'use strict'

const { directory: { find } } = require('@toa.io/filesystem')
const boot = require('../..')

const { instances } = require('./instances')

/**
 * @param {string} reference
 * @param {string} base
 * @returns {toa.core.extensions.Factory}
 */
const resolve = (reference, base = process.cwd()) => {
  const path = find(reference, base)

  if (instances[path] === undefined) instances[path] = create(path)

  return instances[path]
}

const create = (path) => {
  const { Factory } = require(path)

  return new Factory(boot)
}

exports.resolve = resolve
