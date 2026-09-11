import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { markdown } from './report.ts'
import type { Report } from './report.ts'

const report: Report = {
  base: { ref: 'dev', sha: 'dc40febc1aa5b935510b885f1a34a00f3def25e6' },
  head: { ref: 'HEAD', sha: '0123456789abcdef0123456789abcdef01234567' },
  machine: { model: 'AMD Ryzen 7 7800X3D', cpus: 16, governor: 'powersave', pinned: true },
  blocks: 4,
  threshold: 0.05,
  scenarios: [
    {
      id: 'small',
      rate: 5000,
      processes: [
        {
          name: 'gateway',
          base: 812.4,
          head: 870.9,
          estimate: { ratio: 1.0712, low: 1.0501, high: 1.0933, difference: 58.5 },
          verdict: 'slower'
        },
        {
          name: 'bench',
          base: 300,
          head: 301,
          estimate: { ratio: 1.003, low: 0.98, high: 1.02, difference: 1 },
          verdict: 'unchanged'
        }
      ],
      counts: { base: { publish: 2, operations: 0 }, head: { publish: 2, operations: 0 } },
      latency: { base: { p50: 1.2, p99: 4.5 }, head: { p50: 1.3, p99: 4.9 } },
      busy: 0.02
    },
    {
      id: 'create',
      rate: 2000,
      processes: [],
      counts: { base: { publish: 3, operations: 2 }, head: { publish: 3, operations: 3.01 } },
      latency: { base: { p50: 2, p99: 8 }, head: { p50: 2.1, p99: 8.2 } },
      busy: 0.31
    },
    { id: 'mcp.tools.list', unsupported: 'the base revision has no `mcp`' }
  ]
}

describe('markdown', () => {
  const text = markdown(report)

  it('should name both revisions', () => {
    assert.match(text, /HEAD \(0123456\) against dev \(dc40feb\)/)
  })

  it('should state a verdict per process', () => {
    assert.match(text, /\| small \| gateway \| 812 \| 871 \| 1\.071 \| 1\.050 – 1\.093 \| \*\*slower\*\* \|/)
    assert.match(text, /\| small \| bench \| 300 \| 301 \| 1\.003 \| 0\.980 – 1\.020 \| unchanged \|/)
  })

  it('should mark a changed count', () => {
    assert.match(text, /\| create \| 3\.00 \| 3\.00 \| 2\.00 \| 3\.01 \| \*\*changed\*\* \|/)
    assert.match(text, /\| small \| 2\.00 \| 2\.00 \| 0\.00 \| 0\.00 \| {2}\|/)
  })

  it('should flag a window the host was busy in', () => {
    assert.match(text, /\| create \| 2000 \| 2\.00 \| 2\.10 \| 8\.00 \| 8\.20 \| 31% ⚠ \|/)
  })

  it('should list what the base cannot serve', () => {
    assert.match(text, /mcp\.tools\.list: the base revision has no `mcp`/)
  })
})
