'use strict'

const { match } = require('@toa.io/libraries/generic')
const { ReplayException } = require('../exceptions')

/**
 * @param {toa.sampling.Sample} sample
 * @param {toa.core.Reply} reply
 * @param {string} endpoint
 */
const verify = (sample, reply, endpoint) => {
  if (sample.reply === undefined) return

  const matches = match(reply, sample.reply)

  if (!matches) throw new ReplayException(`Operation '${endpoint}' reply mismatch`)
}

exports.verify = verify
