'use strict'

const { resolve } = require('path')
const { load } = require('@toa.io/libraries/yaml')
const { freeze } = require('@toa.io/libraries/generic')

exports.query = freeze(load.sync(resolve(__dirname, './query.yaml')))
exports.error = freeze(load.sync(resolve(__dirname, './error.yaml')))
