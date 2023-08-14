'use strict'

const { join, relative } = require('node:path')
const { file } = require('@toa.io/filesystem')
const yaml = require('@toa.io/yaml')

/**
 * @param {string} path
 * @returns {object[]}
 */
const readDirectory = (path) => {
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
  const id = calculateID(root, path)

  return { id, schema }
}

/**
 * @param {string} root
 * @param {string} path
 * @returns {string}
 */
const calculateID = (root, path) => {
  const base = path.slice(0, -EXTENSION.length)

  return relative(root, base)
}

const EXTENSION = '.cos.yaml'

exports.readDirectory = readDirectory
