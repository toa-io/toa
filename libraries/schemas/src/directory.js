'use strict'

const { join, basename } = require('node:path')
const { file } = require('@toa.io/libraries/filesystem')
const yaml = require('@toa.io/libraries/yaml')

/**
 * @param {string} path
 * @returns {object[]}
 */
const directory = (path) => {
  const pattern = join(path, '*' + EXTENSION)
  const files = file.glob.sync(pattern)

  return files.map(load)
}

/**
 * @param {string} path
 * @returns {object}
 */
const load = (path) => {
  /** @type {object} */
  const schema = yaml.load.sync(path)

  if (schema.$id === undefined) schema.$id = basename(path, EXTENSION)

  return schema
}

const EXTENSION = '.cos.yaml'

exports.directory = directory
