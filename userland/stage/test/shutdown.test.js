'use strict'

const { it, beforeEach, mock: mocking } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock'),
  state: require('./state.mock')
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })
mocking.module('../src/state', { namedExports: mock.state })

const { state } = require('../src/state')
const stage = require('../')

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
