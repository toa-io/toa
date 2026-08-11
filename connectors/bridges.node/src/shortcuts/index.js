'use strict'

const { fetch } = require('./fetch')
const { amqp } = require('./amqp')
const { configuration } = require('./configuration')
const { state } = require('./state')
const { stash } = require('./stash')
const { storages } = require('./storages')
const { logs } = require('./logs')
const { span } = require('./span')

exports.fetch = fetch
exports.amqp = amqp
exports.configuration = configuration
exports.state = state
exports.stash = stash
exports.storages = storages
exports.logs = logs
exports.span = span
