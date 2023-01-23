'use strict'

const { reduce } = require('@toa.io/libraries/generic')
const stage = require('@toa.io/userland/stage')

/**
 * @param {toa.samples.Components} components
 * @return {Promise<Record<string, toa.core.Component>>}
 */
const connect = async (components) => {
  const promises = Object.keys(components).map((id) => stage.remote(id))
  const remotes = await Promise.all(promises)

  return reduce(remotes, (remotes, remote) => (remotes[remote.locator.id] = remote))
}

exports.connect = connect
