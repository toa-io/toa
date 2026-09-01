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
    return atom(group, options)
  }
}

/** @type {Map<string, Atom>} */
const atoms = new Map()

/**
 * One atom per group per process, however many ask for it. A second would register a second
 * time in a group that has one replica, and every replica of that group would then be told it
 * owns half of what it does.
 */
function atom (group, options) {
  let atom = atoms.get(group)

  if (atom === undefined) {
    atom = new Atom(connection(), group, options.interval)

    atoms.set(group, atom)
  }

  return atom
}

exports.Factory = Factory
