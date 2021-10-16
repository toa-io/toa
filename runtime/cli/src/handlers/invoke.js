'use strict'

const boot = require('@toa.io/boot')
const { yaml } = require('@toa.io/gears')
const { Locator } = require('@toa.io/core')
const { load } = require('@toa.io/package')

const { root } = require('../util')

async function invoke (argv) {
  const manifest = await load(root(argv.path))
  const request = yaml.parse(argv.request)

  const composition = await boot.composition([root(argv.path)], { bindings: null })
  await composition.connect()

  const locator = new Locator(manifest)
  const remote = await boot.remote(locator.id, [])
  await remote.connect()

  const reply = await remote.invoke(argv.operation, request)

  await remote.disconnect()
  await composition.disconnect()

  console.dir(reply)
}

exports.invoke = invoke
