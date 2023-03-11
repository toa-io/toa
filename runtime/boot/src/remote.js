'use strict'

const { Remote } = require('@toa.io/core')
const { remap } = require('@toa.io/generic')

const boot = require('./index')

/**
 * @param {toa.core.Locator} locator
 * @param {toa.norm.Component} manifest
 * @returns {Promise<Remote>}
 */
const remote = async (locator, manifest = undefined) => {
  const discovery = await boot.discovery.discovery()

  if (manifest === undefined) manifest = await discovery.lookup(locator)

  const calls = remap(manifest.operations,
    (definition, endpoint) => boot.call(locator, endpoint, definition))

  const remote = new Remote(locator, calls)

  // ensure discovery shutdown
  remote.depends(discovery)

  return remote
}

exports.remote = remote
