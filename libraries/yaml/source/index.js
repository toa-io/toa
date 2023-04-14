'use strict'

const { file: { read, write } } = require('@toa.io/filesystem')

const yaml = require('js-yaml')
const extensions = require('./extensions')

/**
 * @param {string} path
 * @returns {Promise<object>}
 */
const load = async (path) => {
  const contents = await read(path)

  return parse(contents, path)
}

/**
 * @param {string} path
 * @returns {Promise<object[]>}
 */
load.all = async (path) => {
  const contents = await read(path)
  const objects = split(contents)

  return objects.map((object) => process(object, path))
}

/**
 * @param {string} path
 * @returns {object}
 */
load.sync = (path) => {
  const contents = read.sync(path)

  return parse(contents, path)
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
 * @param {string} [path]
 * @returns {object}
 */
const parse = (string, path) => {
  const object = yaml.load(string)

  return process(object, path)
}

/**
 * @param {string} string
 * @returns {Object[]}
 */
const split = (string) => yaml.loadAll(string)

function process (object, path) {
  const string = dump(object) // resolve references into duplicate objects
  const copy = yaml.load(string)

  return extend(copy, path)
}

/**
 *
 * @param {object} object
 * @param {string} [path]
 * @return {object}
 */
const extend = (object, path) => {
  return extensions.reduce((value, extension) => extension(value, path, exports), object)
}

exports.load = load
exports.dump = dump
exports.parse = parse
exports.split = split
exports.save = save
