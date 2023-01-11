'use strict'

const { match } = require('@toa.io/libraries/generic')
const { ReplayException } = require('../exceptions')

/**
 * @param {toa.core.Request} sample
 * @param {toa.core.Request} request
 */
const verify = (sample, request) => {
  throw new ReplayException(`operation request mismatch`)
}

exports.verify = verify
