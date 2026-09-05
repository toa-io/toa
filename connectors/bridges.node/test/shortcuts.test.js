import { equal, ok } from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as shortcuts from '../src/shortcuts/index.js'

/**
 * How a contribution is presented on the context is this bridge's — a bash bridge has no
 * context to present anything on. What is on it is the extension's, and the two are only
 * consistent while every shortcut answers something an extension declares.
 */
describe('shortcuts', () => {
  it('should present what an extension declares, and nothing else', async () => {
    const declared = new Set(SYSTEM)

    for (const [reference, declaration] of Object.entries(EXTENSIONS)) {
      const extension = await import(reference)

      ok(typeof extension.context === 'function',
        `'${reference}' declares no contribution`)

      const contributed = extension.context(declaration)
      const list = Array.isArray(contributed) ? contributed : [contributed]

      for (const contribution of list) declared.add(contribution.name)
    }

    for (const name of Object.keys(shortcuts))
      ok(declared.has(name),
        `'${name}' is presented on the context, and nothing declares it`)
  })

  it('should present every key an extension declares', async () => {
    for (const [reference, declaration] of Object.entries(EXTENSIONS)) {
      const extension = await import(reference)
      const contributed = extension.context(declaration)
      const list = Array.isArray(contributed) ? contributed : [contributed]

      for (const contribution of list)
        ok(contribution.name in shortcuts,
          `'${reference}' declares '${contribution.name}', which nothing presents`)
    }
  })

  it('should not lose a contribution to a rename', () => {
    // the aspect an extension registers is what a shortcut is looked up by
    equal(typeof shortcuts.configuration, 'function')
    equal(typeof shortcuts.storages, 'function')
  })
})

/** What no extension declares: a system aspect, and a binding. */
const SYSTEM = ['atom', 'amqp']

/** Asked with a declaration a component could have written. */
const EXTENSIONS = {
  '@toa.io/extensions.configuration': { schema: { type: 'object' } },
  '@toa.io/extensions.storages': ['assets'],
  '@toa.io/extensions.stash': null,
  '@toa.io/extensions.state': null,
  '@toa.io/extensions.telemetry': null,
  '@toa.io/extensions.fetch': null,
  '@toa.io/extensions.cadence': null
}
