'use strict'

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

const { state } = require('./state')

/** @type {toa.stage.Remote} */
const remote = async (id) => {
  const segments = id.split('.')

  if (segments.length === 1) segments.unshift('default')

  const [namespace, name] = segments
  const locator = new Locator(name, namespace)
  const remote = await boot.remote(locator, SOURCE)

  await remote.connect()

  state.remotes.push(remote)

  return remote
}

/**
 * A feature suite calls components the way a service does, so it says so: without this
 * every call it makes is attributed to an unidentified origin, and a test run leaves
 * `unknown` on the application's map.
 */
const SOURCE = { service: 'features' }

exports.remote = remote
