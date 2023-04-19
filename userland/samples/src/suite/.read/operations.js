'use strict'

const { basename, join } = require('node:path')
const { file: { glob } } = require('@toa.io/filesystem')
const { merge } = require('@toa.io/generic')
const yaml = require('@toa.io/yaml')

const { parse } = require('./parse')

/**
 * @param {string} path
 * @param {toa.samples.suite.Options} options
 * @returns {Promise<toa.samples.suite.Operations>}
 */
const operations = async (path, options) => {
  /** @type {toa.samples.suite.Operations} */
  const operations = {}

  const pattern = join(path, DIRECTORY, PATTERN)
  const files = await glob(pattern)

  for (const file of files) {
    const name = basename(file, EXTENSION)
    const [component, operation] = parse(name, options.id)

    if ('component' in options && component !== options.component) continue

    const samples = /** @type {toa.samples.Operation[]} */ await yaml.load.all(file)

    if (operations[component] === undefined) operations[component] = {}

    /** @type {toa.samples.operations.Set} */
    const set = operations[component]

    if (set[operation] === undefined) set[operation] = samples
    else set[operation] = /** @type {toa.samples.Operation[]} */ merge(set[operation], samples)
  }

  return operations
}

const DIRECTORY = 'samples'
const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.operations = operations
