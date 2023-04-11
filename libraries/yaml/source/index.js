'use strict'

const { file: { read, write } } = require('@toa.io/filesystem')

const yaml = require('js-yaml')

/**
 * @param {string} path
 * @returns {Promise<object>}
 */
const load = async (path) => {
  const contents = await read(path)

  return parse(contents)
}

/**
 * @param {string} path
 * @returns {Promise<object[]>}
 */
load.all = async (path) => {
  const contents = await read(path)

  return split(contents)
}

/**
 * @param {string} path
 * @returns {object}
 */
load.sync = (path) => {
  const contents = read.sync(path)

  return parse(contents)
}

/**
 * @param {object} object
 * @param {string} path
 * @returns {Promise<void>}
 */
const save = async (object, path) => {
  const contents = dump(object)

  await write(path, contents)
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
 * @param {object} object
 * @returns {string}
 */
const dump = (object) => yaml.dump(object, { noRefs: true, lineWidth: -1 })

/**
 * @param {string} string
 * @returns {object}
 */
const parse = (string) => {
  const object = yaml.load(string)
  const plain = dump(object) // resolve references into duplicate objects

  return yaml.load(plain)
}

/**
 * @param {string} string
 * @returns {Object[]}
 */
const split = (string) => yaml.loadAll(string)

exports.load = load
exports.dump = dump
exports.parse = parse
exports.split = split
exports.save = save
