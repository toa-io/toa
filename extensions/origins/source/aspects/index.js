'use strict'

const http = require('./http')
const amqp = require('./amqp')

module.exports = [http.create, amqp.create]
