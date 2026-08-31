'use strict'

const { Outbox } = require('@toa.io/core')

const boot = require('./index')

/**
 * A component with no declared events has nothing to publish and therefore no outbox — the
 * static check that keeps the common case free of a transaction.
 *
 * @param {toa.norm.Component} manifest
 * @param {toa.core.Storage} [storage]
 * @param {toa.core.Emission} [emission]
 */
const outbox = (manifest, storage, emission) => {
  if (emission === undefined) return

  // whether rows are durable at all is the storage's answer, and it is only known once it is
  // open — so the partition is built here and connected there
  return new Outbox(emission, storage, boot.atomicity(manifest.locator.id), {})
}

exports.outbox = outbox
