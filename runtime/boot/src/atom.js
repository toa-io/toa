'use strict'

const { Connector } = require('@toa.io/core')

const boot = require('./index')

/**
 * The atom as a system aspect. Every component has `context.atom`, with nothing declared in its
 * manifest and nothing of its own to configure.
 *
 * @implements {toa.core.extensions.Aspect}
 */
class Aspect extends Connector {
  name = 'atom'

  #atom

  constructor (atom) {
    super()

    this.#atom = atom

    this.depends(atom)
  }

  // the methods are named rather than forwarded, so that the connector's lifecycle is not
  // reachable from an algorithm
  invoke (method, ...args) {
    switch (method) {
      case 'slots': return this.#atom.slots(...args)
      case 'meter': return this.#atom.meter(...args)
      case 'lock': return this.#atom.lock(...args)
      default: throw new Error(`Atom aspect has no '${method}' method`)
    }
  }
}

/** @param {string} group */
const atom = (group) => new Aspect(boot.atomicity(group))

exports.atom = atom
