'use strict'

const { Partition } = require('./partition')
const { connection } = require('./connection')

class Factory {
  /**
   * @param {toa.core.Locator} locator
   * @param {object} [options]
   */
  partition (locator, options = {}) {
    // the group is the component: its registrants are exactly the processes hosting it
    return new Partition(connection(), locator.id, options.interval)
  }
}

exports.Factory = Factory
