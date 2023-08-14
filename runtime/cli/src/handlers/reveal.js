'use strict'

const { secrets } = require('@toa.io/kubernetes')

const { PREFIX } = require('./conceal')

const reveal = async (argv) => {
  const prefixed = PREFIX + argv.secret
  const data = await secrets.get(prefixed)

  if (data === null) return

  for (const [key, value] of Object.entries(data)) {
    const line = `${key}: ${value}`

    console.log(line)
  }
}

exports.reveal = reveal
