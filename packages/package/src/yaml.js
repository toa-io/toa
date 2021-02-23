'use strict'

const fs = require('fs')
const util = require('util')

const yaml = require('js-yaml')

const load = async path => {
  const readFile = util.promisify(fs.readFile)
  const contents = await readFile(path, 'utf8')

  return yaml.load(contents)
}

exports.yaml = load
