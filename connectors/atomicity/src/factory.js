'use strict'

const { Atom } = require('./atom')
const { connection } = require('./connection')

class Factory {
  /**
   * What the replicas of one group decide together. They find each other by `group` and by
   * nothing else, so what shares a name shares a decision.
   *
   * @param {string} group
   * @param {object} [options]
   */
  atom (group, options = {}) {
    return new Atom(connection(), group, options.interval)
  }
}

exports.Factory = Factory
