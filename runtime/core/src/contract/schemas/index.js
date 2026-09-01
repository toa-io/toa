'use strict'

const { resolve } = require('path')
const { readFileSync } = require('node:fs')
const { load: parseYAML } = require('js-yaml')

exports.query = read(resolve(__dirname, './query.yaml'))
exports.error = read(resolve(__dirname, './error.yaml'))
exports.source = read(resolve(__dirname, './source.yaml'))

function read (path) {
  return parseYAML(readFileSync(path, 'utf8'))
}
