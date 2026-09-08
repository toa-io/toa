import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { doomed } from './prune-ghcr.js'

const NOW = Date.parse('2026-09-08T00:00:00Z')
const DAY = 24 * 60 * 60 * 1000

describe('doomed', () => {
  it('should delete untagged versions', () => {
    const ids = doomed([version(1, 1, []), version(2, 1, ['alpha'])], NOW)

    assert.deepStrictEqual(ids, [1])
  })

  it('should keep alpha, latest, and a graduated version', () => {
    const ids = doomed(
      [
        version(1, 200, ['alpha']),
        version(2, 200, ['latest']),
        version(3, 200, ['1.2.3'])
      ],
      NOW
    )

    assert.deepStrictEqual(ids, [])
  })

  it('should keep a prerelease that still has the channel tag', () => {
    const ids = doomed([version(1, 200, ['1.0.0-alpha.1', 'alpha'])], NOW)

    assert.deepStrictEqual(ids, [])
  })

  it('should keep the 30 newest prereleases even when they are old', () => {
    const versions = Array.from({ length: 31 }, (_, index) =>
      version(index + 1, 100 + index, [`1.0.0-alpha.${index + 1}`])
    )

    assert.deepStrictEqual(doomed(versions, NOW), [31])
  })

  it('should keep a prerelease younger than 90 days beyond the last 30', () => {
    const versions = Array.from({ length: 50 }, (_, index) =>
      version(index + 1, 10, [`1.0.0-alpha.${index + 1}`])
    )

    assert.deepStrictEqual(doomed(versions, NOW), [])
  })

  it('should delete prereleases older than 90 days outside the last 30', () => {
    const versions = Array.from({ length: 35 }, (_, index) =>
      version(index + 1, 100 + index, [`1.0.0-alpha.${index + 1}`])
    )

    assert.deepStrictEqual(doomed(versions, NOW), [31, 32, 33, 34, 35])
  })
})

/**
 * @param {number} id
 * @param {number} daysAgo
 * @param {string[]} tags
 */
function version(id, daysAgo, tags) {
  return {
    id,
    created_at: new Date(NOW - daysAgo * DAY).toISOString(),
    metadata: { container: { tags } }
  }
}
