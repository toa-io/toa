'use strict'

const { readFile } = require('node:fs/promises')
const { readFileSync } = require('node:fs')

const yaml = require('js-yaml')

/**
 * @param {string} path
 * @returns {Promise<Object>}
 */
const load = async (path) => {
  const contents = await readFile(path, 'utf8')

  return yaml.load(contents)
}

/**
 * @param {string} path
 * @returns {Promise<Object[]>}
 */
load.all = async (path) => {
  const contents = await readFile(path, 'utf8')

  return yaml.loadAll(contents)
}

/**
 * @param {string} path
 * @returns {Object}
 */
load.sync = (path) => {
  const contents = readFileSync(path, 'utf8')

  return yaml.load(contents)
}

/**
 * @param {string} path
 * @returns {Promise<Object | null>}
 */
load.try = async (path) => {
  try {
    return await load(path)
  } catch (e) {
    return null
  }
}

/**
 * @param {Object} object
 * @returns {string}
 */
const dump = (object) => yaml.dump(object, { noRefs: true, lineWidth: -1 })

/**
 * @param {string} string
 * @returns {Object}
 */
const parse = (string) => yaml.load(string)

/**
 * @param {string} string
 * @returns {Object[]}
 */
const split = (string) => yaml.loadAll(string)

exports.load = load
exports.dump = dump
exports.parse = parse
exports.split = split
