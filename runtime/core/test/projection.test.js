import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Transition } from '../source/transition.js'
import { Observation } from '../source/observation.js'
import { Effect } from '../source/effect.js'
import { codes } from '../source/exceptions.js'

const entity = {
  deleted: false,
  get: () => ({ id: 'x', VERSION: 1 }),
  set: () => undefined
}

function scope() {
  return {
    init: () => entity,
    object: async () => entity,
    commit: mock.fn(async () => true),
    fit: () => undefined
  }
}

function operation(Type) {
  const cascade = { run: mock.fn(async () => ({ output: 'answered' })), link: () => null }

  return new Type(
    cascade,
    scope(),
    { request: { fit: () => null }, reply: { fit: () => null } },
    { parse: (query) => query },
    { scope: 'object' }
  )
}

/*
 * Marked authentic, which is what a call stamps and what makes the recipient skip the contract:
 * the contract is where a projection is refused for every other type, and this is the request
 * that goes past it.
 */
const request = () => ({
  id: 'a'.repeat(32),
  input: null,
  query: { id: 'x', projection: ['title'] },
  authentic: true
})

describe('projection', () => {
  for (const [what, Type] of [
    ['a transition', Transition],
    ['an effect', Effect]
  ])
    it(`should refuse one sent to ${what}`, async () => {
      const reply = await operation(Type).invoke(request())

      assert.strictEqual(reply.exception?.code, codes.RequestContract)
    })

  it('should take one sent to an observation', async () => {
    const reply = await operation(Observation).invoke(request())

    assert.strictEqual(reply.exception, undefined)
    assert.strictEqual(reply.output, 'answered')
  })
})
