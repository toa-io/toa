'use strict'

const boot = require('@toa.io/boot')
const { load } = require('./load')

/**
 * @param {string} reference
 * @returns {Promise<toa.core.Component>}
 **/
const component = async (reference) => {
  const manifest = await load(reference)
  const component = await boot.component(manifest)

  await component.connect()

  return component
}

exports.component = component
