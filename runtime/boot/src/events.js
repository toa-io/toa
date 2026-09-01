'use strict'

/**
 * The events of this component that something consumes. An event nobody consumes is not
 * published, so it gets no emitter and no exchange, and a component none of whose events are
 * consumed gets no emission — and therefore no outbox and no transaction.
 *
 * The deployment computes this from the whole context. Without one — a local run, `toa mono`,
 * a composition booted in a test — the variable is absent and every event is published.
 *
 * @param {toa.norm.Component} manifest
 * @returns {toa.norm.Events | undefined}
 */
const events = (manifest) => {
  if (manifest.events === undefined) return

  const value = process.env[VARIABLE + manifest.locator.uppercase]

  if (value === undefined) return manifest.events

  const consumed = new Set(value.split(' ').filter(Boolean))
  const entries = Object.entries(manifest.events).filter(([label]) => consumed.has(label))

  return entries.length === 0 ? undefined : Object.fromEntries(entries)
}

const VARIABLE = 'TOA_EVENTS_'

exports.events = events
