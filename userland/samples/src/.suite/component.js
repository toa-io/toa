'use strict'

const stage = require('@toa.io/userland/stage')
const load = require('./.component')

/**
 * @param {string} path
 * @return {Promise<[string, toa.samples.Component]>}
 */
const component = async (path) => {
  const manifest = await stage.manifest(path)
  const operations = await load.operations(manifest)
  const component = { operations }

  return [manifest.locator.id, component]
}

exports.component = component
