'use strict'

const { resolve } = require('path')
const { yaml, freeze } = require('@kookaburra/gears')

exports.query = freeze(yaml.sync(resolve(__dirname, './query.yaml')))
exports.error = freeze(yaml.sync(resolve(__dirname, './error.yaml')))
