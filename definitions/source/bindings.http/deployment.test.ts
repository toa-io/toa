import { it } from 'node:test'
import assert from 'node:assert/strict'

import { deployment } from './deployment.ts'
import { VARIABLE } from './const.ts'

it('renders the addresses a context states', () => {
  const dependency = deployment(undefined, { 'media.videos': 'http://media-videos:8005' })

  assert.deepStrictEqual(dependency.variables?.global, [
    { name: VARIABLE, value: '{"media.videos":"http://media-videos:8005"}' }
  ])
})

it('reads one address as the address of every component', () => {
  const dependency = deployment(undefined, 'http://one:8005')

  assert.deepStrictEqual(dependency.variables?.global, [
    { name: VARIABLE, value: '{".":"http://one:8005"}' }
  ])
})

it('states an empty map where a context states no address', () => {
  const dependency = deployment(undefined)

  assert.deepStrictEqual(dependency.variables?.global, [{ name: VARIABLE, value: '{}' }])
})
