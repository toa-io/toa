'use strict'

const boot = require('@toa.io/boot')
const yaml = require('@toa.io/yaml')
const { components: find } = require('../util/find')

async function invoke (argv) {
  const path = find(argv.path)
  const request = argv.request ? yaml.parse(argv.request) : {}

  const composition = await boot.composition([path])
  await composition.connect()

  const manifest = await boot.manifest(path)
  const remote = await boot.remote(manifest.locator, manifest)
  await remote.connect()

  let reply

  try {
    reply = await remote.invoke(argv.operation, request)
  } finally {
    await remote.disconnect()
    await composition.disconnect()
  }

  if (reply !== undefined) console.log(reply)
}

exports.invoke = invoke
