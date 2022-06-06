'use strict'

const boot = require('@toa.io/boot')
const { yaml } = require('@toa.io/gears')
const { manifest: find } = require('../util/find')

async function invoke (argv) {
  const path = find(argv.path)
  const request = yaml.parse(argv.request)

  const composition = await boot.composition([path], { bindings: null })
  await composition.connect()

  const manifest = await boot.component(path)
  const remote = await boot.remote(manifest.locator, manifest)
  await remote.connect()

  try {
    const reply = await remote.invoke(argv.operation, request)

    console.dir(reply)
  } finally {
    await remote.disconnect()
    await composition.disconnect()
  }
}

exports.invoke = invoke
