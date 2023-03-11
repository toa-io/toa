'use strict'

const { dump } = require('@toa.io/yaml')

const reset = (provider) => console.log('unset ' + provider.key)

const print = async (provider, argv) => {
  await provider.connect()

  const formatter = argv.json ? JSON.stringify : dump

  console.log(formatter(provider.object))
}

exports.subcommands = { print, reset }
