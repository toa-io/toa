import { Assignment } from './assignmentClass.js'

/**
 * @implements {toa.node.algorithms.Factory}
 */
export class ChangesetAssignmentFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Assignment()
  }
}
