'use strict'

const { freeze } = require('@kookaburra/gears')

const { Operation } = require('./operation')

class Observation extends Operation {
  async preprocess (request) {
    const context = super.preprocess(request)

    freeze(context.state)

    return context
  }
}

exports.Observation = Observation
