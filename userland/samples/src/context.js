'use strict'

const { context: load } = require('@toa.io/norm')
const { components } = require('./components')

/** @type {toa.samples.replay.Context} */
const context = async (path) => {
  const context = await load(path)
  const paths = context.components.map((component) => component.path)

  return components(paths)
}

exports.context = context
