'use strict'

const { Factory } = require('./factory')
const { deployments } = require('./deployments')

exports.Factory = Factory
exports.properties = { async: true }
exports.deployments = deployments
