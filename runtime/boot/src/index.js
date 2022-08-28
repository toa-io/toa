'use strict'

const { call } = require('./call')
const { cascade } = require('./cascade')
const { component } = require('./component')
const { composition } = require('./composition')
const { context } = require('./context')
const { deployment } = require('./deployment')
const { emission } = require('./emission')
const { exposition } = require('./exposition')
const { images } = require('./images')
const { manifest } = require('./manifest')
const { operation } = require('./operation')
const { receivers } = require('./receivers')
const { remote } = require('./remote')
const { storage } = require('./storage')

exports.bindings = require('./bindings')
exports.bridge = require('./bridge')
exports.contract = require('./contract')
exports.discovery = require('./discovery')
exports.extensions = require('./extensions')

exports.call = call
exports.cascade = cascade
exports.component = component
exports.composition = composition
exports.context = context
exports.deployment = deployment
exports.emission = emission
exports.exposition = exposition
exports.images = images
exports.manifest = manifest
exports.operation = operation
exports.receivers = receivers
exports.remote = remote
exports.storage = storage
