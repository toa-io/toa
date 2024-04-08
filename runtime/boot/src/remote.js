'use strict'

const { Remote } = require('@toa.io/core')
const { remap } = require('@toa.io/generic')

const boot = require('./index')

const remote = async (locator, manifest) => {
  const discovery = await boot.discovery.discovery()

  if (manifest === undefined)
    manifest = await discovery.lookup(locator)

  const calls = manifest.operations === undefined
    ? {}
    : remap(manifest.operations, (definition, endpoint) => boot.call(locator, endpoint, definition, manifest.entity))

  const remote = new Remote(locator, calls)

  // ensure discovery shutdown
  remote.depends(discovery)

  return remote
}

exports.remote = remote
