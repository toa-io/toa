'use strict'

const { manifest } = require('./manifest')
const { annotation } = require('./annotation')
const { deployment } = require('./deployment')

const { Factory } = require('./factory')

exports.manifest = manifest
exports.annotation = annotation
exports.deployment = deployment

exports.Factory = Factory
