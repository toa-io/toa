'use strict'

const { join } = require('node:path')
const stage = require('@toa.io/userland/stage')

const { COLLECTION } = require('./constants')

const composition = async (references, options) => {
  const paths = /** @type {string[]} */ references.map((reference) => join(COLLECTION, reference))

  await stage.composition(paths, options)
}

exports.composition = composition
