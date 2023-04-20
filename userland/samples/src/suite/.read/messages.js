'use strict'

const { join, basename } = require('node:path')
const { file: { glob } } = require('@toa.io/filesystem')
const yaml = require('@toa.io/yaml')

const { filter } = require('./filter')

/**
 * @param {string} path
 * @param {toa.samples.suite.Options} options
 * @returns {Promise<toa.samples.messages.Set>}
 */
const messages = async (path, options) => {
  /** @type {toa.samples.messages.Set} */
  const messages = {}

  const pattern = join(path, DIRECTORY, PATTERN)
  const files = await glob(pattern)

  for (const file of files) {
    const label = basename(file, EXTENSION)

    let samples = /** @type {toa.samples.Message[]} */ await yaml.load.all(file)

    if (options.id !== undefined) samples.forEach((sample) => (sample.component = options.id))
    if (options.component !== undefined) samples = samples.filter((sample) => sample.component === options.component)
    if (options.title !== undefined) samples = filter(samples, options.title)

    messages[label] = samples
  }

  return messages
}

const DIRECTORY = 'samples/messages'
const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.messages = messages
