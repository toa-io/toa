'use strict'

const { Factory } = require('./factory')
const { deployment } = require('./deployment')
const { manifest } = require('./manifest')

exports.Factory = Factory
exports.deployment = deployment
exports.manifest = manifest
exports.id = require('../package.json').name
