'use strict'

const clone = require('clone-deep')
const { join } = require('node:path')

const { overwrite } = require('@toa.io/generic')
const { save, load, parse } = require('@toa.io/yaml')

/**
 * @param {string} directory
 * @param {string} [additions]
 */
const template = async (directory, additions) => {
  const path = join(directory, FILENAME)
  const template = clone(TEMPLATE)

  if (additions !== undefined) {
    const add = parse(additions)

    overwrite(template, add)
  }

  await save(template, path)
}

const FILENAME = 'context.toa.yaml'
const TEMPLATE = load.sync(join(__dirname, FILENAME))

exports.template = template
