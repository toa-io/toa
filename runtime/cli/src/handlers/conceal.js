'use strict'

const { secrets } = require('@toa.io/kubernetes')

const conceal = async (argv) => {
  const values = argv['key-values'].reduce((values, pair) => {
    const [key, value] = pair.split('=')

    values[key] = value

    return values
  }, {})

  const secret = PREFIX + argv.secret

  await secrets.upsert(secret, values, argv.namespace)
}

const PREFIX = 'toa-'

exports.conceal = conceal
exports.PREFIX = PREFIX
