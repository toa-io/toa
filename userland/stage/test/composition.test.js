import { it, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import * as _boot from './boot.mock.js'

const mock = {
  boot: _boot
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })

const stage = await import('../src/index.js')

const paths = [generate(), generate()]

it('should be', () => {
  assert.notStrictEqual(stage.composition, undefined)
})

it('should boot composition', async () => {
  await stage.composition(paths)

  assert.deepStrictEqual(mock.boot.composition.mock.calls[0].arguments[0], paths)

  const composition = await mock.boot.composition.mock.calls[0].result

  assert.ok(composition.connect.mock.callCount() > 0)
})
