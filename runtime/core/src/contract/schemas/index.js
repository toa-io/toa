'use strict'

const { resolve } = require('path')
const { load } = require('@toa.io/yaml')
const { freeze } = require('@toa.io/generic')

exports.query = freeze(load.sync(resolve(__dirname, './query.yaml')))
exports.error = freeze(load.sync(resolve(__dirname, './error.yaml')))
