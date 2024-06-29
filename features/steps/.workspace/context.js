'use strict'

const { join } = require('node:path')

const { save, load, parse } = require('@toa.io/yaml')

/**
 * @param {string} directory
 * @param {string} [additions]
 */
const template = async (directory, additions) => {
  const path = join(directory, FILENAME)
  const template = structuredClone(TEMPLATE)

  if (additions !== undefined) {
    const add = parse(additions)

    Object.assign(template, add)
  }

  await save(template, path)
}

const FILENAME = 'context.toa.yaml'
const TEMPLATE = load.sync(join(__dirname, FILENAME))

exports.template = template
