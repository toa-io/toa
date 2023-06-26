'use strict'

const { manifest } = require('./manifest')
const { extension } = require('./extension')
const { Factory } = require('./factory')

exports.manifest = manifest
exports.deployment = extension
exports.Factory = Factory
