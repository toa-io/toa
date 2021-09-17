'use strict'

const { resolve } = require('path')
const { yaml, freeze } = require('@kookaburra/gears')

exports.request = freeze(yaml.sync(resolve(__dirname, './request.yaml')))
