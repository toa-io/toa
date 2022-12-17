'use strict'

const stage = require('@toa.io/userland/stage')
const { components: load } = require('./suite')
const { replay } = require('./replay')

/** @type {toa.samples.replay.Components} */
const components = async (paths) => {
  await stage.composition(paths)

  const suite = await load(paths)
  const ok = await replay(suite)

  await stage.shutdown()

  return ok
}

exports.components = components
