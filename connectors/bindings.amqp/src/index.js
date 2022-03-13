'use strict'

const { Factory } = require('./factory')
const { deployment } = require('./deployment')

exports.Factory = Factory
exports.properties = { async: true }
exports.deployment = deployment
