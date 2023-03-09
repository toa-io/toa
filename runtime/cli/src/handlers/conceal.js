'use strict'

const { secrets } = require('@toa.io/kubernetes')

const conceal = async (argv) => {
  const { secret, key, value } = argv

  await secrets.store(secret, { [key]: value })
}

exports.conceal = conceal
