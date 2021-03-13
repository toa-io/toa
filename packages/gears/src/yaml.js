'use strict'

const fs = require('fs')
const util = require('util')

const yaml = require('js-yaml')

const load = async path => {
  const readFile = util.promisify(fs.readFile)
  const contents = await readFile(path, 'utf8')
  const object = yaml.load(contents)

  return object
}

load.sync = path => {
  const contents = fs.readFileSync(path)
  const object = yaml.load(contents)

  return object
}

load.try = async path => {
  try {
    return await load(path)
  } catch (e) {
    return null
  }
}

exports.yaml = load
