'use strict'

const { Operation } = require('./operation')

class Unmanaged extends Operation {
  acquire (context) {
    context.state = this.scope.storage.raw
  }
}

exports.Unmanaged = Unmanaged
