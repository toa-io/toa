'use strict'

const { secrets } = require('@toa.io/kubernetes')
const { remap, decode } = require('@toa.io/generic')

const { PREFIX } = require('./conceal')

const reveal = async (argv) => {
  const prefixed = PREFIX + argv.secret
  const secret = await secrets.get(prefixed)
  const values = remap(secret.data, decode)

  for (const [key, value] of Object.entries(values)) {
    const line = `${key}: ${value}`

    console.log(line)
  }
}

exports.reveal = reveal
