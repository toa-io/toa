'use strict'

const { connect, test } = require('./.replay')

/** @type {toa.samples.replay.Replay} */
const replay = async (suite) => {
  const remotes = await connect(suite.components)

  return await test(suite, remotes)
}

exports.replay = replay
