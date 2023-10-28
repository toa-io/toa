'use strict'

const { components: load } = require('./suite')
const { replay } = require('./replay')

/** @type {toa.samples.replay.components} */
const components = async (paths, options = {}) => {
  const suite = await load(paths, options)

  return await replay(suite, paths, options.runner)
}

exports.components = components
