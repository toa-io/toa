'use strict'

const { basename, join } = require('node:path')
const { file: { glob } } = require('@toa.io/libraries/filesystem')
const { merge } = require('@toa.io/libraries/generic')
const yaml = require('@toa.io/libraries/yaml')

const { parse } = require('./parse')

/**
 * @param {string} path
 * @param {string} [id]
 * @returns {Promise<toa.samples.suite.Operations>}
 */
const operations = async (path, id) => {
  /** @type {toa.samples.suite.Operations} */
  const operations = {}

  const pattern = join(path, DIRECTORY, PATTERN)
  const files = await glob(pattern)

  for (const file of files) {
    const name = basename(file, EXTENSION)
    const [component, operation] = parse(name, id)

    /** @type {toa.samples.Operation[]} */
    const samples = await yaml.load.all(file)

    if (operations[component] === undefined) operations[component] = {}

    /** @type {toa.samples.operations.Set} */
    const set = operations[component]

    if (set[operation] === undefined) set[operation] = samples
    else set[operation] = merge(set[operation], samples)
  }

  return operations
}

const DIRECTORY = 'samples'
const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.operations = operations
