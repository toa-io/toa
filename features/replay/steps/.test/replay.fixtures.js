'use strict'

const { flip } = require('@toa.io/libraries/generic')

const replay = /** @type {jest.MockedFn<toa.samples.replay.Replay>} */
  jest.fn(async () => flip())

const stage = {
  composition: jest.fn(async () => undefined),
  shutdown: jest.fn(async () => undefined)
}

exports.mock = { samples: { replay }, stage }
