'use strict'

const load = require('./load')
const { Operation } = require('./operation')
const { Event } = require('./event')
const { Receiver } = require('./receiver')

class Factory {
  operation (root, name, context) {
    const operation = load.operation(root, name)
    return new Operation(operation, context)
  }

  event (root, label) {
    const event = load.event(root, label)
    return new Event(event)
  }

  receiver (root, label) {
    const receiver = load.receiver(root, label)
    return new Receiver(receiver)
  }
}

exports.Factory = Factory
