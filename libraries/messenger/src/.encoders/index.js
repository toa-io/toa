'use strict'

const json = require('./json')
const msgpack = require('./msgpack')

exports['application/json'] = json
exports['application/msgpack'] = msgpack
