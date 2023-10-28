'use strict'

const { factory } = require('./factory')

const receive = (binding, locator, label, group, receiver) => factory(binding).receiver(locator, label, group, receiver)

exports.receive = receive
