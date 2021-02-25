'use strict'

const path = require('path')

const simple = require('./package.simple.assets')
const calculator = require('./package.calculator.assets')

const dummiesPath = path.dirname(require.resolve('@kookaburra/dummies'))

exports.simple = simple
exports.calculator = calculator
exports.dummiesPath = dummiesPath
