'use strict'

const { secrets } = require('@toa.io/kubernetes')

const conceal = async (argv) => {
  const { secret, key, value } = argv
  const prefixed = PREFIX + secret

  await secrets.store(prefixed, { [key]: value })
}

const PREFIX = 'toa-'

exports.conceal = conceal
exports.PREFIX = PREFIX
