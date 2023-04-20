'use strict'

const norm = require('@toa.io/norm')

const test = require('./components')
const { context: load } = require('./suite')
const { replay } = require('./replay')

/** @type {toa.samples.replay.context} */
const context = async (path, options = {}) => {
  const context = await norm.context(path)
  const paths = context.components.map((component) => component.path)
  const suite = await load(path, options)

  let ok = true

  if (options.integration !== true) ok = await test.components(paths, options)
  if (ok) ok = await replay(suite, paths)

  return ok
}

exports.context = context
