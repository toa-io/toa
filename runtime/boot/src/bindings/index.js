'use strict'

const { consume } = require('./consume')
const { emit } = require('./emit')
const { produce } = require('./produce')
const { receive } = require('./receive')

exports.consume = consume
exports.emit = emit
exports.produce = produce
exports.receive = receive
