'use strict'

const { factory } = require('./factory')

const receive = (binding, source, label, group, receiver) => factory(binding).receiver(source, label, group, receiver)

exports.receive = receive
