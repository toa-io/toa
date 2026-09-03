import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { create, current, decide, decode, encode, run, sampling } from './tracing.js'
import { exporting } from './exporters.js'
import type * as tracing from './tracing.js'

const exporter = { export: () => undefined }

// a trace is only sampled if something consumes what it records
beforeEach(() => {
  exporting([exporter])
})

afterEach(() => {
  sampling()
  exporting([])
})

describe('create', () => {
  it('should create root context', () => {
    const context = create()

    assert.match(context.traceId as string, /^[\da-f]{32}$/)
    assert.match(context.spanId as string, /^[\da-f]{16}$/)
    assert.strictEqual(context.parentId, undefined)
    assert.strictEqual(context.sampled, true)
  })

  it('should create child context', () => {
    const parent = create()
    const child = create(parent)

    assert.strictEqual(child.traceId, parent.traceId)
    assert.notStrictEqual(child.spanId, parent.spanId)
    assert.strictEqual(child.parentId, parent.spanId)
  })

  it('should inherit sampled flag', () => {
    const parent = { ...create(), sampled: false }
    const child = create(parent)

    assert.strictEqual(child.sampled, false)
  })
})

describe('sampling', () => {
  it('should not sample when nothing consumes spans', () => {
    exporting([])

    for (let i = 0; i < 10; i++)
      assert.strictEqual(decide(), false)
  })

  it('should sample once an exporter is configured', () => {
    exporting([])

    assert.strictEqual(decide(), false)

    exporting([exporter])

    assert.strictEqual(decide(), true)
  })

  it('should sample all traces by default', () => {
    for (let i = 0; i < 10; i++)
      assert.strictEqual(decide(), true)
  })

  it('should not sample when sample is 0', () => {
    sampling({ sample: 0 })

    for (let i = 0; i < 10; i++)
      assert.strictEqual(create().sampled, false)
  })

  it('should not re-decide for children', () => {
    sampling({ sample: 0 })

    const parent = { ...create(), sampled: true }

    assert.strictEqual(create(parent).sampled, true)
  })

  it('should limit the rate of recorded traces', () => {
    sampling({ rate: 2 })

    const decisions = Array.from({ length: 10 }, () => create().sampled)

    assert.strictEqual(decisions.filter(Boolean).length, 2)
  })

  it('should refill the bucket over time', async () => {
    sampling({ rate: 100 })

    while (decide());

    assert.strictEqual(decide(), false)

    await new Promise((resolve) => setTimeout(resolve, 30))

    assert.strictEqual(decide(), true)
  })

  it('should allow at least one trace for fractional rate', () => {
    sampling({ rate: 0.1 })

    assert.strictEqual(decide(), true)
    assert.strictEqual(decide(), false)
  })
})

describe('traceparent', () => {
  it('should roundtrip', () => {
    const context = create()
    const decoded = decode(encode(context))

    assert.partialDeepStrictEqual(decoded, {
      traceId: context.traceId,
      spanId: context.spanId,
      sampled: true
    })
  })

  it('should encode sampled flag', () => {
    const context = { ...create(), sampled: false }

    assert.match(encode(context), /-00$/)
    assert.strictEqual(decode(encode(context))?.sampled, false)
  })

  for (const [_, header] of [
    ['garbage', 'garbage'],
    ['wrong version', '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'],
    ['short trace id', '00-4bf92f3577b34da6-00f067aa0ba902b7-01'],
    ['uppercase hex', '00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01'],
    ['zero trace id', '00-00000000000000000000000000000000-00f067aa0ba902b7-01'],
    ['zero span id', '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01']
  ])
     it(`should reject ${_}`, () => {
    assert.strictEqual(decode(header), null)
  })
})

describe('module copies', () => {
  // a process may load several copies of the module (the package installed more than once)
  let copy: typeof tracing

  beforeEach(async () => {
    copy = await import('./tracing.js')
  })

  it('should share the context', () => {
    const context = create()

    run(context, () => assert.strictEqual(copy.current(), context))
  })

  it('should share the sampling configuration', () => {
    copy.sampling({ sample: 0 })

    assert.strictEqual(decide(), false)
  })

  it('should share the rate limit', () => {
    copy.sampling({ rate: 1 })

    assert.strictEqual(decide(), true)
    assert.strictEqual(copy.decide(), false)
  })
})

describe('run', () => {
  it('should expose context within callback', () => {
    const context = create()

    assert.strictEqual(current(), undefined)

    run(context, () => assert.strictEqual(current(), context))

    assert.strictEqual(current(), undefined)
  })

  it('should isolate concurrent chains', async () => {
    const seen: string[] = []

    async function chain (id: string): Promise<void> {
      await run({ ...create(), traceId: id.repeat(32) }, async () => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10))
        seen.push(`${id}:${current()?.traceId[0]}`)
      })
    }

    await Promise.all([chain('a'), chain('b'), chain('c')])

    assert.deepStrictEqual(seen.sort(), ['a:a', 'b:b', 'c:c'])
  })
})
