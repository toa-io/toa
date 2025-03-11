'use strict'

const { http } = require('./http')
const { amqp } = require('./amqp')
const { configuration } = require('./configuration')
const { state } = require('./state')
const { stash } = require('./stash')
const { storages } = require('./storages')
const { pubsub } = require('./pubsub')
const { logs } = require('./logs')
const { mail } = require('./mail')

exports.http = http
exports.amqp = amqp
exports.configuration = configuration
exports.state = state
exports.stash = stash
exports.storages = storages
exports.pubsub = pubsub
exports.logs = logs
exports.mail = mail
