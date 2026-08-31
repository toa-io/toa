'use strict'

const { Partition } = require('./partition')
const { connection } = require('./connection')

class Factory {
  /**
   * @param {string} group what the replicas registering together have in common
   * @param {object} [options]
   */
  partition (group, options = {}) {
    return new Partition(connection(), group, options.interval)
  }
}

exports.Factory = Factory
