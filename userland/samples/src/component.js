'use strict'

const stage = require('@toa.io/userland/stage')
const { replay } = require('./replay')
const { load } = require('./suite')

/** @type {toa.samples.replay.Component} */
const component = async (path) => {
  const manifest = await stage.manifest(path)
  const suite = await load(path, manifest.locator.id)

  await stage.composition([path])

  const ok = await replay(suite)

  await stage.shutdown()

  return ok
}

exports.component = component
