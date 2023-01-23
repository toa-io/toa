'use strict'

const { component } = require('./.suite')

/** @type {toa.samples.constructors.Components} */
const components = async (paths) => {
  const autonomous = true

  /** @type {toa.samples.Components} */
  const components = {}

  for (const path of paths) {
    const [id, samples] = await component(path)

    components[id] = samples
  }

  return { autonomous, components }
}

exports.components = components
