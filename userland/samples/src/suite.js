'use strict'

const { component } = require('./.suite')

/** @type {toa.samples.replay.suite.Components} */
const components = async (paths) => {
  /** @type {toa.samples.Components} */
  const components = {}

  for (const path of paths) {
    const [id, samples] = await component(path)

    components[id] = samples
  }

  /** @type {toa.samples.Suite} */
  const suite = { autonomous: true, components }

  return suite
}

exports.components = components
