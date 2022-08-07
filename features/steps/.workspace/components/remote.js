'use strict'

const { Locator } = require('@toa.io/core')
const boot = require('@toa.io/boot')

/**
 * @param {string} namespace
 * @param {string} name
 * @returns {Promise<toa.core.Runtime>}
 */
const remote = async (namespace, name) => {
  const locator = new Locator(name, namespace)
  const remote = await boot.remote(locator)

  await remote.connect()

  return remote
}

exports.remote = remote
