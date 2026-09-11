import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { summarize } from './profile.ts'
import type { CpuProfile } from './profile.ts'

const ROOT = '/work/toa'

const profile: CpuProfile = {
  nodes: [
    { id: 1, callFrame: frame('(root)', ''), children: [2, 3, 4, 5, 6, 7] },
    { id: 2, callFrame: frame('(idle)', '') },
    { id: 3, callFrame: frame('(garbage collector)', '') },
    { id: 4, callFrame: frame('validate', 'file:///work/toa/node_modules/ajv/dist/core.js', 10) },
    { id: 5, callFrame: frame('match', 'file:///work/toa/extensions/exposition/transpiled/RTD/Node.js', 20) },
    { id: 6, callFrame: frame('match', 'file:///work/toa/extensions/exposition/transpiled/RTD/Route.js', 5) },
    { id: 7, callFrame: frame('parse', 'node:internal/url', 1) }
  ],
  startTime: 0,
  endTime: 100_000,
  // µs between samples; the first delta belongs to the first sample
  samples: [2, 3, 4, 4, 5, 6, 7, 2],
  timeDeltas: [50_000, 10_000, 5_000, 5_000, 10_000, 10_000, 10_000, 1_000]
}

describe('summarize', () => {
  const summary = summarize(profile, { root: ROOT })

  it('should leave idle time out of the total', () => {
    assert.equal(summary.total, 50)
  })

  it('should rank functions by self time', () => {
    assert.deepEqual(
      summary.functions.map(({ name, self }) => [name, self]),
      [
        ['(garbage collector)', 10],
        ['validate ajv/dist/core.js:11', 10],
        ['match extensions/exposition/transpiled/RTD/Node.js:21', 10],
        ['match extensions/exposition/transpiled/RTD/Route.js:6', 10],
        ['parse node:internal/url:2', 10]
      ]
    )
  })

  it('should attribute a module to its package or workspace', () => {
    const packages = Object.fromEntries(summary.packages.map(({ name, self }) => [name, self]))

    assert.deepEqual(packages, {
      'extensions/exposition': 20,
      '(garbage collector)': 10,
      ajv: 10,
      node: 10
    })
  })

  it('should state shares of the total', () => {
    assert.equal(summary.packages[0].share, 0.4)
  })

  it('should keep only the top entries', () => {
    assert.equal(summarize(profile, { root: ROOT, top: 2 }).functions.length, 2)
  })
})

function frame(functionName: string, url: string, lineNumber = -1): CpuProfile['nodes'][number]['callFrame'] {
  return { functionName, url, lineNumber, columnNumber: 0, scriptId: '0' }
}
