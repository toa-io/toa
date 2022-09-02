'use strict'

const { join, basename } = require('node:path')
const { file: { glob } } = require('@toa.io/libraries/filesystem')
const { merge } = require('@toa.io/libraries/generic')
const yaml = require('@toa.io/libraries/yaml')
const tools = require('./.suite')

/** @type {toa.samples.replay.Suite} */
const load = async (path, id) => {
  /** @type {toa.samples.Suite} */
  const suite = {}

  const pattern = join(path, 'samples', PATTERN)
  const files = await glob(pattern)

  for (const file of files) {
    const name = basename(file, EXTENSION)
    const [component, operation] = tools.parse(name)
    const declarations = await yaml.load.all(file)
    const samples = declarations.map(tools.translate)

    if (component !== undefined && component !== id) {
      throw new Error(`Component id mismatch: '${id}' expected, '${component}' given`)
    }

    const slice = { [id]: { [operation]: samples } }

    merge(suite, slice)
  }

  return suite
}

const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.load = load
