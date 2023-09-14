'use strict'

const { factory } = require('./factory')

const broadcast = (channel, group, binding = '@toa.io/bindings.amqp') => factory(binding).broadcast(channel, group)

exports.broadcast = broadcast
