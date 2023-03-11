'use strict'

const { match } = require('@toa.io/generic')
const { ReplayException } = require('../exceptions')

/**
 * @param {toa.sampling.Request} sample
 * @param {toa.core.Request} request
 */
const verify = (sample, request) => {
  const matches = match(request, sample)

  if (!matches) throw new ReplayException(`operation request mismatch`)
}

exports.verify = verify
