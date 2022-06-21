'use strict'

const boot = require('@toa.io/boot')
const yaml = require('@toa.io/libraries.yaml')
const { component: find } = require('../util/find')

async function invoke (argv) {
  const path = find(argv.path)
  const request = yaml.parse(argv.request)

  const composition = await boot.composition([path], { bindings: null })
  await composition.connect()

  const manifest = await boot.component(path)
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
