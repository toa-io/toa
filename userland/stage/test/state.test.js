import { it } from 'node:test'
import assert from 'node:assert/strict'

import { state } from '../src/state.js'

it('should be', () => {
  assert.notStrictEqual(state, undefined)
})

it('should reset', () => {
  const component = /** @type {toa.core.Component} */ 1
  const composition = /** @type {toa.core.Connector} */ 2
  const remote = /** @type {toa.core.Component} */ 3

  assert.deepStrictEqual(state.components.length, 0)
  assert.deepStrictEqual(state.compositions.length, 0)
  assert.deepStrictEqual(state.remotes.length, 0)

  state.components.push(component)
  state.compositions.push(composition)
  state.remotes.push(remote)

  state.reset()

  assert.deepStrictEqual(state.components.length, 0)
  assert.deepStrictEqual(state.compositions.length, 0)
  assert.deepStrictEqual(state.remotes.length, 0)
})
