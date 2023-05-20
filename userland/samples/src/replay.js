'use strict'

const stage = require('@toa.io/userland/stage')
const { test } = require('./.replay')

/** @type {toa.samples.replay.replay} */
const replay = async (suite, paths, options) => {
  await stage.composition(paths)

  const ok = await test(suite, options)

  await stage.shutdown()

  return ok
}

exports.replay = replay
