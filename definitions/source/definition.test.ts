import { it } from 'node:test'
import assert from 'node:assert/strict'

import { definition } from './definition.ts'

it('should read a package', async () => {
  const module = (await definition('@toa.io/extensions.exposition')) as Record<
    string,
    unknown
  >

  assert.equal(typeof module.deployment, 'function')
})

it('should read what a package claims under a key', async () => {
  const module = (await definition('@toa.io/extensions.exposition#realtime')) as Record<
    string,
    unknown
  >

  // the key's own deployment, not the package's
  const exposition = (await definition('@toa.io/extensions.exposition')) as Record<
    string,
    unknown
  >

  assert.equal(typeof module.deployment, 'function')
  assert.notEqual(module.deployment, exposition.deployment)
})

it('should refuse a key the package does not claim', async () => {
  await assert.rejects(definition('@toa.io/extensions.exposition#nothing'), {
    message:
      "'@toa.io/extensions.exposition#nothing' names a key that '@toa.io/extensions.exposition' does not claim"
  })
})

it('should know nothing of a package it does not define', async () => {
  assert.equal(await definition('@acme/extension#key'), undefined)
})
