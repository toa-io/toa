'use strict'

const { join, basename } = require('node:path')
const { file: { glob } } = require('@toa.io/libraries/filesystem')
const yaml = require('@toa.io/libraries/yaml')

/**
 * @param {string} path
 * @param {string} [id]
 * @returns {Promise<toa.samples.messages.Set>}
 */
const messages = async (path, id) => {
  /** @type {toa.samples.messages.Set} */
  const messages = {}

  const pattern = join(path, DIRECTORY, PATTERN)
  const files = await glob(pattern)

  for (const file of files) {
    const label = basename(file, EXTENSION)
    const samples = /** @type {toa.samples.Message[]} */ await yaml.load.all(file)

    if (id !== undefined) samples.forEach((sample) => (sample.component = id))

    messages[label] = samples
  }

  return messages
}

const DIRECTORY = 'samples/messages'
const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.messages = messages
