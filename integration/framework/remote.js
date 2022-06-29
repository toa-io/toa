'use strict'

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

/**
 * @param {string} id
 * @returns {toa.core.Runtime}
 */
const remote = async (id) => {
  const [namespace, name] = id.split('.')
  const locator = new Locator(name, namespace)
  const remote = await boot.remote(locator)
  await remote.connect()

  return remote
}

exports.remote = remote
