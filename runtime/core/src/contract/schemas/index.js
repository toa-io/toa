'use strict'

const { resolve } = require('path')
const { load } = require('@toa.io/yaml')

exports.query = load.sync(resolve(__dirname, './query.yaml'))
exports.error = load.sync(resolve(__dirname, './error.yaml'))
exports.source = load.sync(resolve(__dirname, './source.yaml'))
