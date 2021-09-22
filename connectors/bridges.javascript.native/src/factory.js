'use strict'

const { Operation } = require('./operation')

class Factory {
  operation (root, declaration, context) {
    return new Operation(root, declaration, context)
  }

  event () {

  }
}

exports.Factory = Factory
