'use strict'

const { match } = require('@toa.io/libraries/generic')
const { ReplayException } = require('../exceptions')

/**
 * @param {toa.core.Reply} sample
 * @param {toa.core.Reply} reply
 */
const verify = (sample, reply) => {
  const matches = match(reply, sample)

  if (!matches) throw new ReplayException(`operation reply mismatch`)
}

exports.verify = verify
