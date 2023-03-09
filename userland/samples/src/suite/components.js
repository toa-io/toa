'use strict'

const norm = require('@toa.io/norm')
const { merge } = require('@toa.io/generic')

const read = require('./.read')

/**
 * @param {string[]} paths
 * @returns {Promise<toa.samples.Suite>}
 */
const components = async (paths) => {
  /** @type {toa.samples.Suite} */
  const suite = { title: 'Component samples', autonomous: true, operations: {}, messages: {} }

  for (const path of paths) {
    const manifest = await norm.component(path)
    const id = manifest.locator.id
    const operations = await read.operations(path, id)
    const messages = await read.messages(path, id)

    merge(suite, { operations, messages })
  }

  return suite
}

exports.components = components
