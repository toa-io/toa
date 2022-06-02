'use strict'

const { factory } = require('./factory')

const broadcast = (binding, name, group) => factory(binding).broadcaster(name, group)

exports.broadcast = broadcast
