'use strict'

const { test, stage } = require('./.replay')

/** @type {toa.samples.replay.replay} */
const replay = async (suite, paths, options = undefined) => {
  const components = await stage.setup(paths, suite.autonomous)

  const ok = await test(suite, components, options)

  await stage.shutdown()

  return ok
}

exports.replay = replay
