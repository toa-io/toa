'use strict'

const { match } = require('@toa.io/libraries/generic')
const { ReplayException } = require('../exceptions')

/**
 * @param {toa.sampling.Request} sample
 * @param {toa.core.Request} request
 */
const verify = (sample, request) => {
  if (sample === undefined) return

  const matches = match(request, sample)

  if (!matches) throw new ReplayException(`operation request mismatch`)
}

exports.verify = verify
