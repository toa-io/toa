'use strict'

const { merge } = require('@toa.io/libraries/generic')

const { component } = require('./.suite')

/** @type {toa.samples.replay.suite.Components} */
const components = async (paths) => {
  /** @type {toa.samples.Suite} */
  const suite = { autonomous: true }

  for (const path of paths) {
    const samples = await component(path)

    merge(suite, samples)
  }

  return suite
}

exports.components = components
