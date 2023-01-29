'use strict'

const { join, basename } = require('node:path')
const { file: { glob } } = require('@toa.io/libraries/filesystem')
const yaml = require('@toa.io/libraries/yaml')

/**
 * @param {toa.norm.Component} manifest
 * @returns {Promise<toa.samples.messages.Set>}
 */
const messages = async (manifest) => {
  /** @type {toa.samples.messages.Set} */
  const messages = {}

  const pattern = join(manifest.path, DIRECTORY, PATTERN)
  const files = await glob(pattern)

  for (const file of files) {
    const label = basename(file, EXTENSION)
    const samples = /** @type {toa.samples.Message[]} */ await yaml.load.all(file)

    messages[label] = samples
  }

  return messages
}

const DIRECTORY = 'samples/messages'
const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.messages = messages
