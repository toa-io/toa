'use strict'

const boot = require('@toa.io/boot')
const { load } = require('./load')

/**
 * @param {string} reference
 * @returns {Promise<toa.core.Runtime>}
 **/
const connect = async (reference) => {
  const manifest = await load(reference)
  const component = await boot.runtime(manifest)

  await component.connect()

  return component
}

exports.connect = connect
