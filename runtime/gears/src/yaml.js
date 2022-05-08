'use strict'

const { readFile } = require('node:fs/promises')
const { readFileSync } = require('node:fs')
const yaml = require('js-yaml')

/**
 * @param path {string}
 * @returns {Promise<Object>}
 */
const load = async path => {
  const contents = await readFile(path, 'utf8')

  return yaml.load(contents)
}

load.sync = path => {
  const contents = readFileSync(path, 'utf8')

  return yaml.load(contents)
}

load.try = async path => {
  try {
    return await load(path)
  } catch (e) {
    return null
  }
}

load.dump = (object) => yaml.dump(object, { noRefs: true })
load.parse = (string) => yaml.load(string)

exports.yaml = load
