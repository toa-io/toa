'use strict'

const { Factory } = require('./factory')
const { binding } = require('./binding')

const properties = { async: true }

exports.properties = properties
exports.Factory = Factory
exports.binding = binding
