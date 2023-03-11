'use strict'

const path = require('node:path')
const boot = require('@toa.io/boot')

const { COLLECTION } = require('./constants')

/**
 * @param {string} reference
 * @returns {toa.norm.Component}
 */
const load = async (reference) => {
  const path = resolve(reference)

  return await boot.manifest(path)
}

/**
 * @param {string} reference
 * @returns {string}
 */
const resolve = (reference) => {
  return path.resolve(COLLECTION, reference)
}

exports.load = load
exports.resolve = resolve
