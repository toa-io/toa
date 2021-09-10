'use strict'

const { call } = require('./call')
const { composition } = require('./composition')
const { context } = require('./context')
const { discovery } = require('./discovery')
const { exposition } = require('./exposition')
const { operation } = require('./operaion')
const { remote } = require('./remote')
const { runtime } = require('./runtime')
const { storage } = require('./storage')

exports.promise = require('./promise')
exports.bindings = require('./bindings')

exports.call = call
exports.composition = composition
exports.context = context
exports.discovery = discovery
exports.exposition = exposition
exports.operation = operation
exports.remote = remote
exports.runtime = runtime
exports.storage = storage
