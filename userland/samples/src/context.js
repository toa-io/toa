'use strict'

const norm = require('@toa.io/norm')

const test = require('./components')
const { context: load } = require('./suite')
const { replay } = require('./replay')

/** @type {toa.samples.replay.context} */
const context = async (path, options = {}) => {
  const context = await norm.context(path)
  const suite = await load(path, options)
  const paths = context.components.map((component) => component.path)

  let ok = true

  if (options.integration !== true) ok = await test.components(paths, options)
  if (ok && options.autonomous !== true) ok = await replay(suite, paths, options.runner)

  return ok
}

exports.context = context
