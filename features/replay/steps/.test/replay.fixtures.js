'use strict'

const { flip } = require('@toa.io/generic')

const replay = /** @type {jest.MockedFn<toa.samples.replay.Replay>} */
  jest.fn(async () => flip())

exports.mock = { samples: { replay } }
