import { it, beforeEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import * as _boot from './boot.mock.js'
import * as _state from './state.mock.js'

const mock = {
  boot: _boot,
  state: _state
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })
mocking.module('../src/state', { namedExports: mock.state })

const { state } = await import('../src/state.js')
const stage = await import('../src/index.js')

beforeEach(() => {
  resetCalls()
})

it('should be', () => {
  assert.notStrictEqual(stage.shutdown, undefined)
})

it('should disconnect components', async () => {
  const path = generate()
  const component = await stage.component(path)

  await stage.shutdown()

  assert.ok(component.disconnect.mock.callCount() > 0)
})

it('should disconnect compositions', async () => {
  const paths = [generate(), generate()]

  await stage.composition(paths)
  await stage.shutdown()

  const composition = await mock.boot.composition.mock.calls[0].result

  assert.ok(composition.disconnect.mock.callCount() > 0)
})

it('should disconnect remotes', async () => {
  const id = generate() + '.' + generate()

  const remote = await stage.remote(id)
  await stage.shutdown()

  assert.ok(remote.disconnect.mock.callCount() > 0)
})

it('should reset state', async () => {
  await stage.shutdown()

  assert.ok(state.reset.mock.callCount() > 0)
})

function resetCalls (target = [assert, mock, stage], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
