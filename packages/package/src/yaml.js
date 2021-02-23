'use strict'

const fs = require('fs')
const util = require('util')

const yaml = require('js-yaml')

module.exports = async path => {
  const readFile = util.promisify(fs.readFile)
  const contents = await readFile(path, 'utf8')
  const doc = yaml.load(contents)

  return doc
}
