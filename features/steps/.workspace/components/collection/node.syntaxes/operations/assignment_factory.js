'use strict'

const { Assignment } = require('./assignment_class')

/**
 * @implements {toa.node.algorithms.Factory}
 */
class ChangesetAssignmentFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Assignment()
  }
}

exports.ChangesetAssignmentFactory = ChangesetAssignmentFactory
