import { it, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import * as _boot from './boot.mock.js'

const mock = {
  boot: _boot
}

mocking.module('@toa.io/boot', { namedExports: mock.boot })

const stage = await import('../src/index.js')

it('should be', () => {
  assert.notStrictEqual(stage.component, undefined)
})

it('should boot component', async () => {
  const path = generate()
  const component = await stage.component(path)

  assert.deepStrictEqual(mock.boot.manifest.mock.calls[0].arguments[0], path)
  const manifest = await mock.boot.manifest.mock.calls[0].result

  assert.ok(mock.boot.component.mock.calls.some((call) =>
    call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], manifest)))
  assert.deepStrictEqual(component, await mock.boot.component.mock.calls[0].result)
  assert.ok(component.connect.mock.callCount() > 0)
})
