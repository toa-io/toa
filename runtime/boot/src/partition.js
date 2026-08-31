'use strict'

/**
 * Partitioning is what lets a replica write into a lane it owns, so that it settles its own
 * rows before it ever sweeps them. Without it every replica sweeps every lane — correct, and
 * only noisier, because a stranded row is then published more than once.
 *
 * Its Redis is system infrastructure rather than a per-component resource, so the presence of
 * one environment variable is the whole switch.
 *
 * @param {toa.core.Locator} locator
 */
const partition = (locator) => {
  if (process.env[VARIABLE] === undefined || process.env[VARIABLE] === '') return

  const { Factory } = require(MODULE)

  return new Factory().partition(locator)
}

const VARIABLE = 'TOA_OUTBOX_REDIS'
const MODULE = '@toa.io/partitions.redis'

exports.partition = partition
