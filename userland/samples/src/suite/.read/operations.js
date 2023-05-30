'use strict'

const { basename, join } = require('node:path')
const { file: { glob } } = require('@toa.io/filesystem')
const { merge } = require('@toa.io/generic')
const yaml = require('@toa.io/yaml')

const { parse } = require('./parse')
const { filter } = require('./filter')

/**
 * @param {string} path
 * @param {toa.samples.suite.Options} options
 * @param {}
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

    if (options.component !== undefined && component !== options.component) continue
    if (options.operation !== undefined && operation !== options.operation) continue

    let samples = /** @type {toa.samples.Operation[]} */ await yaml.load.all(file)

    if (options.title !== undefined) samples = filter(samples, options.title)
    if (samples.length === 0) continue

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
