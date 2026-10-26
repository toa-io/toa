import { it } from 'node:test'
import assert from 'node:assert/strict'
import { shipped } from './read.ts'
import { components } from '../extensions.chronicles/components.ts'

/*
A service looks the component it runs up in the digest, because its image has no parser to read
the sources with. What a definition deploys depends on the annotation, which a service does not
have, so the lookup is of everything shipped: with the encounters filtered out, the relay of a
context that serves them read their sources and crashed.
*/

it('should hold every component an extension ships, whatever its annotation deploys', () => {
  assert.ok(!components().labels.includes('chronicles-encounters'))
  assert.ok(shipped('extensions.chronicles')?.labels.includes('chronicles-encounters'))
})

it('should hold nothing for an extension Toa does not ship', () => {
  assert.strictEqual(shipped('extensions.unknown'), undefined)
})
