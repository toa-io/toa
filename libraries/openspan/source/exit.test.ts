import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { exiting } from './exit.ts'

describe('exiting', () => {
  it('should flush every exporter through one listener', () => {
    const before = process.listenerCount('beforeExit')
    const flushed: number[] = []

    const exporters = Array.from({ length: 20 }, (_, index) => ({
      flush: async () => void flushed.push(index)
    }))

    for (const exporter of exporters) exiting(exporter)

    assert.equal(process.listenerCount('beforeExit'), before + 1)

    const listener = process.listeners('beforeExit').at(-1) as () => void

    process.off('beforeExit', listener)
    listener()

    assert.equal(flushed.length, exporters.length)
  })
})
