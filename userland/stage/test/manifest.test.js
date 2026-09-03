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
  assert.notStrictEqual(stage.manifest, undefined)
})

it('should boot manifest', async () => {
  const path = generate()

  const manifest = await stage.manifest(path)

  assert.ok(mock.boot.manifest.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], path)))
  assert.deepStrictEqual(manifest, await mock.boot.manifest.mock.calls[0].result)
})
