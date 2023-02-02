'use strict'

const stage = require('@toa.io/userland/stage')
const { test } = require('./.replay')

/** @type {toa.samples.replay.replay} */
const replay = async (suite, paths) => {
  await stage.composition(paths)

  const ok = await test(suite)

  await stage.shutdown()

  return ok
}

exports.replay = replay
