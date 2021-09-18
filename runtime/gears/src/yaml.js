'use strict'

const fs = require('fs')
const util = require('util')
const yaml = require('js-yaml')

const load = async path => {
  const readFile = util.promisify(fs.readFile)
  const contents = await readFile(path, 'utf8')

  return yaml.load(contents)
}

load.sync = path => {
  const contents = fs.readFileSync(path)

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
