'use strict'

const { Assignment } = require('./assignmentClass')

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
