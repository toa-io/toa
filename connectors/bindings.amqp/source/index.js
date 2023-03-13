'use strict'

const { deployment } = require('./deployment')
const { annotation } = require('./annotation')
const { Factory } = require('./factory')

/** @type {toa.core.bindings.Properties} */
const properties = { async: true }

exports.properties = properties
exports.annotation = annotation
exports.deployment = deployment
exports.Factory = Factory
