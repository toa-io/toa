'use strict'

const { Operation } = require('./operation')
const { Event } = require('./event')

class Factory {
  operation (root, name, type, context) {
    return new Operation(root, name, type, context)
  }

  event (root, label) {
    return new Event(root, label)
  }
}

exports.Factory = Factory
