'use strict'

const { factory } = require('./factory')

const receive = (binding, locator, endpoint, id, receiver) => factory(binding).receiver(locator, endpoint, id, receiver)

exports.receive = receive
