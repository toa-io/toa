'use strict'

const norm = require('@toa.io/norm')
const test = require('./components')

/** @type {toa.samples.replay.context} */
const context = async (path) => {
  const context = await norm.context(path)
  const paths = context.components.map((component) => component.path)

  return test.components(paths)
}

exports.context = context
