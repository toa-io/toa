import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { args, read } from './load.ts'

describe('read', () => {
  it('should count the requests answered with the expected status', () => {
    const result = read(output({ '200': 4980 }), 200)

    assert.deepEqual(result, { requests: 4980, rate: 498, p50: 1.5, p99: 12 })
  })

  it('should refuse another status', () => {
    assert.throws(() => read(output({ '200': 4000, '401': 3 }), 200), /401 × 3/)
  })

  it('should refuse transport errors', () => {
    assert.throws(
      () => read(output({ '200': 10 }, { 'connection closed before message completed': 2 }), 200),
      /connection closed before message completed × 2/
    )
  })

  it('should refuse a window with no answers', () => {
    assert.throws(() => read({ ...output({}), statusCodeDistribution: {} }, 200), /no requests/i)
  })

  it('should refuse what is not oha output', () => {
    assert.throws(() => read({ hello: 'world' }, 200), /oha/)
  })
})

describe('args', () => {
  it('should send a number of requests at a fixed rate with latency correction', () => {
    const result = args({
      url: 'http://bench.local:31090/bench/small/',
      method: 'GET',
      headers: { accept: 'application/json', authorization: 'Token x' },
      connect: 'bench.local:31090:127.0.0.1:31090',
      duration: 10,
      connections: 32,
      rate: 5000,
      http2: false
    })

    assert.deepEqual(result, [
      '--no-tui',
      '--output-format',
      'json',
      '-n',
      '50000',
      '-c',
      '32',
      '-m',
      'GET',
      '-H',
      'accept: application/json',
      '-H',
      'authorization: Token x',
      '--connect-to',
      'bench.local:31090:127.0.0.1:31090',
      '-q',
      '5000',
      '--latency-correction',
      'http://bench.local:31090/bench/small/'
    ])
  })

  it('should send a body file over HTTP/2 without a rate', () => {
    const result = args({
      url: 'http://127.0.0.1:31092/bench/items/',
      method: 'POST',
      headers: {},
      body: '/cache/body.json',
      duration: 5,
      connections: 8,
      http2: true
    })

    assert.deepEqual(result, [
      '--no-tui',
      '--output-format',
      'json',
      '-z',
      '5s',
      '-w',
      '-c',
      '8',
      '-m',
      'POST',
      '-D',
      '/cache/body.json',
      '--http2',
      'http://127.0.0.1:31092/bench/items/'
    ])
  })
})

function output(statuses: Record<string, number>, errors: Record<string, number> = {}): object {
  return {
    summary: { successRate: 1, total: 10, requestsPerSec: 498, average: 0.002 },
    latencyPercentiles: { p50: 0.0015, p90: 0.004, p99: 0.012 },
    rps: { mean: 498 },
    statusCodeDistribution: statuses,
    errorDistribution: errors
  }
}
