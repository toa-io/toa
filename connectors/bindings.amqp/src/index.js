'use strict'

const { Factory } = require('./factory')
const { deployment } = require('./deployment')
const { annotations } = require('./annotations')

exports.properties = { async: true }
exports.deployment = deployment
exports.annotations = annotations
exports.Factory = Factory
