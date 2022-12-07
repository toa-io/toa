'use strict'

const { join, basename } = require('node:path')
const { file: { glob } } = require('@toa.io/libraries/filesystem')
const { merge } = require('@toa.io/libraries/generic')
const yaml = require('@toa.io/libraries/yaml')
const stage = require('@toa.io/userland/stage')

const { parse } = require('./parse')
const { translate } = require('./translate')

/**
 * @param {string} path
 * @return {Promise<Partial<toa.samples.Suite>>}
 */
const component = async (path) => {
  /** @type {Partial<toa.samples.Suite>} */
  const set = {}
  const manifest = await stage.manifest(path)
  const id = manifest.locator.id

  const pattern = join(path, 'samples', PATTERN)
  const files = await glob(pattern)

  for (const file of files) {
    const name = basename(file, EXTENSION)
    const [component, operation] = parse(name)
    const declarations = await yaml.load.all(file)
    const samples = declarations.map(translate)

    if (id !== undefined && component !== undefined && component !== id) {
      throw new Error(`Component id mismatch: '${id}' expected, '${component}' given`)
    }

    const slice = { [id]: { [operation]: samples } }

    merge(set, slice)
  }

  return set
}

const EXTENSION = '.yaml'
const PATTERN = '*' + EXTENSION

exports.component = component
