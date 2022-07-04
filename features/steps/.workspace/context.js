'use strict'

const clone = require('clone-deep')
const { join } = require('node:path')
const { merge } = require('@toa.io/libraries/generic')
const { save, load, parse } = require('@toa.io/libraries/yaml')

/**
 * @param {string} directory
 * @param {string} [additions]
 */
const template = async (directory, additions) => {
  const path = join(directory, FILENAME)
  const template = clone(TEMPLATE)

  if (additions !== undefined) {
    const patch = parse(additions)

    merge(template, patch)
  }

  await save(template, path)
}

const FILENAME = 'context.toa.yaml'
const TEMPLATE = load.sync(join(__dirname, FILENAME))

exports.template = template
