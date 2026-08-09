import { create, current, decide, decode, encode, run, sampling } from './tracing'
import type * as tracing from './tracing'

afterEach(() => {
  sampling()
})

describe('create', () => {
  it('should create root context', () => {
    const context = create()

    expect(context.traceId).toMatch(/^[\da-f]{32}$/)
    expect(context.spanId).toMatch(/^[\da-f]{16}$/)
    expect(context.parentId).toBeUndefined()
    expect(context.sampled).toBe(true)
  })

  it('should create child context', () => {
    const parent = create()
    const child = create(parent)

    expect(child.traceId).toBe(parent.traceId)
    expect(child.spanId).not.toBe(parent.spanId)
    expect(child.parentId).toBe(parent.spanId)
  })

  it('should inherit sampled flag', () => {
    const parent = { ...create(), sampled: false }
    const child = create(parent)

    expect(child.sampled).toBe(false)
  })
})

describe('sampling', () => {
  it('should sample all traces by default', () => {
    for (let i = 0; i < 10; i++)
      expect(decide()).toBe(true)
  })

  it('should not sample when sample is 0', () => {
    sampling({ sample: 0 })

    for (let i = 0; i < 10; i++)
      expect(create().sampled).toBe(false)
  })

  it('should not re-decide for children', () => {
    sampling({ sample: 0 })

    const parent = { ...create(), sampled: true }

    expect(create(parent).sampled).toBe(true)
  })

  it('should limit the rate of recorded traces', () => {
    sampling({ rate: 2 })

    const decisions = Array.from({ length: 10 }, () => create().sampled)

    expect(decisions.filter(Boolean).length).toBe(2)
  })

  it('should refill the bucket over time', async () => {
    sampling({ rate: 100 })

    while (decide());

    expect(decide()).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(decide()).toBe(true)
  })

  it('should allow at least one trace for fractional rate', () => {
    sampling({ rate: 0.1 })

    expect(decide()).toBe(true)
    expect(decide()).toBe(false)
  })
})

describe('traceparent', () => {
  it('should roundtrip', () => {
    const context = create()
    const decoded = decode(encode(context))

    expect(decoded).toMatchObject({
      traceId: context.traceId,
      spanId: context.spanId,
      sampled: true
    })
  })

  it('should encode sampled flag', () => {
    const context = { ...create(), sampled: false }

    expect(encode(context)).toMatch(/-00$/)
    expect(decode(encode(context))?.sampled).toBe(false)
  })

  it.each([
    ['garbage', 'garbage'],
    ['wrong version', '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'],
    ['short trace id', '00-4bf92f3577b34da6-00f067aa0ba902b7-01'],
    ['uppercase hex', '00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01'],
    ['zero trace id', '00-00000000000000000000000000000000-00f067aa0ba902b7-01'],
    ['zero span id', '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01']
  ])('should reject %s', (_, header) => {
    expect(decode(header)).toBeNull()
  })
})

describe('module copies', () => {
  // a process may load several copies of the module (the package installed more than once)
  let copy: typeof tracing

  beforeEach(() => {
    jest.isolateModules(() => {
      copy = require('./tracing')
    })
  })

  it('should share the context', () => {
    const context = create()

    run(context, () => expect(copy.current()).toBe(context))
  })

  it('should share the sampling configuration', () => {
    copy.sampling({ sample: 0 })

    expect(decide()).toBe(false)
  })

  it('should share the rate limit', () => {
    copy.sampling({ rate: 1 })

    expect(decide()).toBe(true)
    expect(copy.decide()).toBe(false)
  })
})

describe('run', () => {
  it('should expose context within callback', () => {
    const context = create()

    expect(current()).toBeUndefined()

    run(context, () => expect(current()).toBe(context))

    expect(current()).toBeUndefined()
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

    expect(seen.sort()).toEqual(['a:a', 'b:b', 'c:c'])
  })
})
