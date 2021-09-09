'use strict'

const { consumer, producer } = require('./bindings')
const { call } = require('./call')
const { composition } = require('./composition')
const { context } = require('./context')
const { discovery } = require('./discovery')
const { exposition } = require('./exposition')
const { locator } = require('./locator')
const { operation } = require('./operaion')
const { remote } = require('./remote')
const { runtime } = require('./runtime')
const { storage } = require('./storage')

exports.promise = require('./promise')
exports.system = require('./system')

exports.consumer = consumer
exports.call = call
exports.composition = composition
exports.context = context
exports.discovery = discovery
exports.exposition = exposition
exports.locator = locator
exports.operation = operation
exports.producer = producer
exports.remote = remote
exports.runtime = runtime
exports.storage = storage
