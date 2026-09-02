import { Assignment } from './assignmentClass.js'

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

export { ChangesetAssignmentFactory }
