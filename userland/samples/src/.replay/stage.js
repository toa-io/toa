'use strict'

const stage = require('@toa.io/userland/stage')
const storage = require.resolve('@toa.io/storages.null')

/**
 * @param {string[]} paths
 * @param {boolean} autonomous
 * @return {Promise<Record<string, toa.core.Component>>}
 */
async function setup (paths, autonomous) {
  if (!autonomous) return remotes(paths)
  else return components(paths)
}

async function remotes (paths) {
  await stage.composition(paths)

  const remotes = {}

  for (const path of paths) {
    const id = await getId(path)

    remotes[id] = await stage.remote(id)
  }

  return remotes
}

async function components (paths) {
  const components = {}

  process.env.TOA_SAMPLING_AUTONOMOUS = '1'

  for (const path of paths) {
    const id = await getId(path)

    components[id] = await stage.component(path, { storage })
  }

  delete process.env.TOA_SAMPLING_AUTONOMOUS

  return components
}

async function getId (path) {
  const manifest = await stage.manifest(path)

  return manifest.locator.id
}

/**
 * @return {Promise<void>}
 */
async function shutdown () {
  await stage.shutdown()
}

exports.setup = setup
exports.shutdown = shutdown
