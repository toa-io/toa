'use strict'

const { Factory } = require('./factory')
const { deployment } = require('./deployment')
const { annotation } = require('./annotation')

exports.properties = { async: true }
exports.annotation = annotation
exports.deployment = deployment
exports.Factory = Factory
