'use strict'

const { basename, join } = require('node:path')
const { file: { glob } } = require('@toa.io/libraries/filesystem')
const { merge } = require('@toa.io/libraries/generic')
const yaml = require('@toa.io/libraries/yaml')

const { parse } = require('./parse')

/**
 * @param {toa.norm.Component} manifest
 * @returns {Promise<toa.samples.operations.Set>}
 */
const operations = async (manifest) => {
  /** @type {toa.samples.operations.Set} */
  const operations = {}
  const pattern = join(manifest.path, DIRECTORY, PATTERN)
  const files = await glob(pattern)
  const id = manifest.locator.id

  for (const file of files) {
    const name = basename(file, EXTENSION)
    const [component, operation] = parse(name)

    /** @type {toa.samples.Operation[]} */
    const samples = await yaml.load.all(file)

    if (id !== undefined && component !== undefined && component !== id) {
      throw new Error(`Component id mismatch: '${id}' expected, '${component}' given`)
    }

    if (operations[operation] === undefined) operations[operation] = samples
    else merge(operations[operation], samples)
  }

  return operations
}

const DIRECTORY = 'samples'
const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.operations = operations
