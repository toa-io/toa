'use strict'

const { manifest } = require('./manifest')
const { deployment } = require('./deployment')

const { Factory } = require('./factory')

exports.manifest = manifest
exports.deployment = deployment

exports.Factory = Factory
