import { it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

mock.module('@toa.io/norm', { namedExports: { component: () => mockComponent() } })

const { manifest } = await import('./manifest.js')


const path = generate()

it('should not modify options', async () => {
  const options = { extensions: ['foo', 'bar'] }

  await manifest(path, options)

  assert.deepStrictEqual(options.extensions.length, 2)
})

function mockComponent () {
  return { name: generate(), namespace: generate() }
}
