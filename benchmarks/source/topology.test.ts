import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { cores, place } from './topology.ts'

describe('cores', () => {
  it('should group logical CPUs by their siblings', () => {
    const siblings = ['0,8', '1,9', '2,10', '3,11', '0,8', '1,9', '2,10', '3,11']

    assert.deepEqual(cores(siblings), [
      [0, 8],
      [1, 9],
      [2, 10],
      [3, 11]
    ])
  })

  it('should read ranges', () => {
    assert.deepEqual(cores(['0-1', '0-1', '2-3', '2-3']), [
      [0, 1],
      [2, 3]
    ])
  })

  it('should order cores by their first CPU', () => {
    assert.deepEqual(cores(['4', '0', '2']), [[0], [2], [4]])
  })
})

describe('place', () => {
  it('should give gateways, components and the load their own cores on 16 CPUs', () => {
    const topology = Array.from({ length: 8 }, (_, core) => [core, core + 8])

    assert.deepEqual(place(topology), {
      gateway: '1,2,9,10',
      components: '3,4,11,12',
      load: '5,6,7,13,14,15'
    })
  })

  it('should give each one core on 8 CPUs', () => {
    const topology = Array.from({ length: 4 }, (_, core) => [core, core + 4])

    assert.deepEqual(place(topology), { gateway: '1,5', components: '2,6', load: '3,7' })
  })

  it('should give each one core on 8 CPUs without siblings', () => {
    const topology = Array.from({ length: 8 }, (_, core) => [core])

    assert.deepEqual(place(topology), { gateway: '1', components: '2', load: '3,4,5,6,7' })
  })

  it('should pin nothing below 8 CPUs', () => {
    const topology = Array.from({ length: 3 }, (_, core) => [core, core + 3])

    assert.deepEqual(place(topology), { gateway: null, components: null, load: null })
  })
})
