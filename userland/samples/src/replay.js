'use strict'

const stage = require('@toa.io/userland/stage')
const { connect, test } = require('./.replay')

/** @type {toa.samples.replay.replay} */
const replay = async (suite, paths) => {
  await stage.composition(paths)

  const remotes = await connect(suite.components)
  const ok = await test(suite, remotes)

  await stage.shutdown()

  return ok
}

exports.replay = replay
