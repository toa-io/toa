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

  const reply = await remote.invoke(argv.operation, request)

  await remote.disconnect()
  await composition.disconnect()

  console.dir(reply)
}

exports.invoke = invoke
