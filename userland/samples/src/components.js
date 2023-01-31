'use strict'

const { components: load } = require('./suite')
const { replay } = require('./replay')

/** @type {toa.samples.replay.components} */
const components = async (paths) => {
  const suite = await load(paths)

  return await replay(suite, paths)
}

exports.components = components
