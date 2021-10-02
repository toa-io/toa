'use strict'

const boot = require('@kookaburra/boot')
const { yaml } = require('@kookaburra/gears')
const { Locator } = require('@kookaburra/core')
const { load } = require('@kookaburra/package')

const { root } = require('../util')

async function invoke (argv) {
  const manifest = await load(root(argv.path))
  const request = yaml.parse(argv.request)

  const composition = await boot.composition([root(argv.path)], { bindings: null })
  await composition.connect()

  const locator = new Locator(manifest)
  const remote = await boot.remote(locator.fqn, [])
  await remote.connect()

  const reply = await remote.invoke(argv.operation, request)

  await remote.disconnect()
  await composition.disconnect()

  console.dir(reply)
}

exports.invoke = invoke
