'use strict'

const { join } = require('node:path')
const stage = require('@toa.io/userland/stage')

const { COLLECTION } = require('./constants')

/**
 * @param {string[]} references
 * @param {string[]} [bindings]
 * @returns {Promise<toa.core.Connector>}
 **/
const composition = async (references, bindings) => {
  const paths = /** @type {string[]} */ references.map((reference) => join(COLLECTION, reference))

  await stage.composition(paths)
}

exports.composition = composition
