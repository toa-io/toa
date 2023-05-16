'use strict'

const { match } = require('@toa.io/generic')
const { ReplayException } = require('../exceptions')

/**
 * @param {toa.core.Reply} sample
 * @param {toa.core.Reply} reply
 */
const verify = (sample, reply) => {
  const matches = match(reply, sample)

  if (!matches) throw new ReplayException(`operation reply mismatch`, reply, sample)
}

exports.verify = verify
