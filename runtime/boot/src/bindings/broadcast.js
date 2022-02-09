'use strict'

const { factory } = require('./factory')

const broadcast = (binding, name, group) => factory(binding).broadcast(name, group)

exports.broadcast = broadcast
