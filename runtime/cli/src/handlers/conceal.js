'use strict'

const { secrets } = require('@toa.io/libraries/kubernetes')

const conceal = async (argv) => {
  const { secret, key, value } = argv

  if (key !== undefined && value !== undefined) await secrets.store(secret, { [key]: value })
  else if (secret !== undefined) await list(secret)
}

const list = async (name) => {
  const secret = await secrets.get(name)
  const keys = Object.keys(secret.data)
  const list = keys.join(', ')

  console.log(list)
}

exports.conceal = conceal
