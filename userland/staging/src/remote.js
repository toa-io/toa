'use strict'

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

const { stage } = require('./stage')

/** @type {toa.userland.staging.Remote} */
const remote = async (id) => {
  const [namespace, name] = id.split('.')
  const locator = new Locator(name, namespace)

  const remote = await boot.remote(locator)

  await remote.connect()
  stage.remotes.push(remote)

  return remote
}

exports.remote = remote
