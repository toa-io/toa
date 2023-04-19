'use strict'

const { join, relative } = require('node:path')
const { file } = require('@toa.io/filesystem')
const yaml = require('@toa.io/yaml')

/**
 * @param {string} path
 * @returns {object[]}
 */
const directory = (path) => {
  const pattern = join(path, '**', '*' + EXTENSION)
  const files = file.glob.sync(pattern)

  return files.map(load(path))
}

/**
 * @param {string} root
 * @returns {object}
 */
const load = (root) => (path) => {
  const schema = yaml.load.sync(path)

  if (schema.$id === undefined) schema.$id = id(root, path)

  return schema
}

/**
 * @param {string} root
 * @param {string} path
 * @returns {string}
 */
const id = (root, path) => {
  const base = path.slice(0, -EXTENSION.length)

  return relative(root, base)
}

const EXTENSION = '.cos.yaml'

exports.directory = directory
