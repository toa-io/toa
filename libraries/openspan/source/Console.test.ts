import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { console, Console, consoleExporter, create, current, exporting, run, sampling } from './index.js'
import type { Channel } from './Console.js'

afterEach(() => {
  sampling()
  exporting([])
})

let instance: Console

const streams: any = {
  stdout: {
    write: mock.fn()
  },
  stderr: {
    write: mock.fn()
  }
}

const context = {
  foo: 'bar',
  baz: 42
}

const channels = ['trace', 'debug', 'info', 'warn', 'error'] as Channel[]

beforeEach(() => {
  resetCalls()

  instance = new Console({ streams, context })
})

it('should be', async () => {
  assert.notStrictEqual(instance, undefined)
})

for (const severity of channels)
   describe(`${severity}`, () => {
    const channel = severity === 'error' ? streams.stderr : streams.stdout

    it('should write', () => {
      instance[severity]('hello')

      assert.ok(channel.write.mock.callCount() > 0)

      assert.partialDeepStrictEqual(pop(channel), {
        severity: severity.toUpperCase(),
        message: 'hello'
      })
    })

    it('should format message', () => {
      instance[severity]('hello world')

      const subject = pop(channel)
      assert.partialDeepStrictEqual(subject, { message: 'hello world' })
      assert.strictEqual(typeof subject['time'], 'string')
    })

    it('should add context', () => {
      instance[severity]('hello')

      assert.partialDeepStrictEqual(pop(channel), {
        context
      })
    })

    it('should add attributes', async () => {
      const attributes = {
        foo: 'baz',
        baz: 24
      }

      instance[severity]('hello world', attributes)

      assert.partialDeepStrictEqual(pop(channel), { attributes })
    })
  })

it('should not print below given level', () => {
  instance.configure({ level: 'warn' })
  instance.info('a')
  instance.error('b')

  assert.strictEqual(pop(streams.stdout), undefined)
  assert.notStrictEqual(pop(streams.stderr), undefined)
})

it('should consider log() as debug()', async () => {
  instance.log('foo')

  const entry = pop(streams.stdout)

  assert.partialDeepStrictEqual(entry, { severity: 'DEBUG' })
})

it('should share the singleton between module copies', async () => {
  const copy = await import('./Console.js')

  assert.strictEqual(copy.console, console)
})

for (const channel of channels)
   describe(`console instance (${channel})`, () => {
  it('should print message', () => {
    console[channel]('Hello')
  })

  it('should print attributes', async () => {
    console[channel]('Hello again', { foo: 42 })
  })
})

it('should fork', async () => {
  const con = instance.fork({ bar: 'foo' })

  con.debug('hello')

  assert.partialDeepStrictEqual(pop(streams.stdout), {
    context: { foo: 'bar', baz: 42, bar: 'foo' }
  })
})

it('should not log undefined attributes', async () => {
  instance.info('hello', undefined)

  const entry = pop(streams.stdout)

  assert.strictEqual('attributes' in entry, false)
  assert.strictEqual(entry.message, 'hello')
})

it('should log empty objects', () => {
  instance.info('foo', { foo: {}, bar: 'baz' })
  instance.info('bar', {})
  instance.info('baz')
})

it('should log Error', () => {
  instance.info('foo', new Error('ok'))
  instance.info('foo', { error: new Error('ok') })
})

it('should serialize Error with stack', () => {
  const error = Object.assign(new Error('oops'), { code: 'E_TEST' })

  instance.error('Failed', error)

  const entry = pop(streams.stderr)

  assert.partialDeepStrictEqual(entry.attributes, {
    message: 'oops',
    code: 'E_TEST'
  })

  assert.ok(entry.attributes.stack.includes('Error: oops'))
})

it('should serialize Error cause chain', () => {
  const root = new Error('root')
  const error = new Error('wrapper', { cause: root })

  instance.error('Failed', error)

  const entry = pop(streams.stderr)

  assert.strictEqual(entry.attributes.message, 'wrapper')
  assert.strictEqual(entry.attributes.cause.message, 'root')
  assert.ok(entry.attributes.cause.stack.includes('Error: root'))
})

it('should serialize non-Error cause', () => {
  const error = new Error('wrapper', { cause: 'just a string' })

  instance.error('Failed', error)

  const entry = pop(streams.stderr)

  assert.strictEqual(entry.attributes.cause, 'just a string')
})

it('should log null', () => {
  instance.info('foo', { foo: null })
})

describe('tracing', () => {
  it('should stamp trace_id and span_id within context', () => {
    const context = create()

    run(context, () => instance.info('hello'))

    assert.partialDeepStrictEqual(pop(streams.stdout), {
      trace_id: context.traceId,
      span_id: context.spanId
    })
  })

  it('should not stamp outside of context', () => {
    instance.info('hello')

    const entry = pop(streams.stdout)

    assert.strictEqual('trace_id' in entry, false)
    assert.strictEqual('span_id' in entry, false)
  })
})

describe('span', () => {
  // a span that nothing consumes is not created at all
  beforeEach(() => {
    exporting([consoleExporter])
  })

  it('should return task result', async () => {
    const result = await instance.span('task', () => 42)

    assert.strictEqual(result, 42)
  })

  it('should not open a span within an unsampled trace', async () => {
    const context = { ...create(), sampled: false }

    const inner = await run(context, async () => await instance.span('work', () => current()))

    // the context in scope is reused rather than replaced, so there is nothing to propagate
    assert.strictEqual(inner, context)
    assert.strictEqual(streams.stdout.write.mock.callCount(), 0)
  })

  it('should still run the task when nothing consumes spans', async () => {
    exporting([])

    const context = { ...create(), sampled: false }
    const result = await run(context, async () => await instance.span('work', () => 42))

    assert.strictEqual(result, 42)
    assert.strictEqual(streams.stdout.write.mock.callCount(), 0)
  })

  it('should write span entry with duration', async () => {
    await instance.span('fetch', async () => await new Promise((resolve) => setTimeout(resolve, 10)))

    const entry = pop(streams.stdout)

    assert.partialDeepStrictEqual(entry, { severity: 'TRACE', message: 'fetch' })
    assert.match(entry['trace_id'], /^[\da-f]{32}$/)
    assert.match(entry['span_id'], /^[\da-f]{16}$/)
    assert.strictEqual(typeof entry['duration'], 'number')

    assert.ok(entry.duration >= 5)
    assert.strictEqual('status' in entry, false)
  })

  it('should write attributes', async () => {
    await instance.span('fetch', { url: 'example.com' }, () => null)

    assert.partialDeepStrictEqual(pop(streams.stdout), {
      attributes: { url: 'example.com' }
    })
  })

  it('should nest spans', async () => {
    await instance.span('outer', async () => {
      await instance.span('inner', () => null)
    })

    const inner = pop(streams.stdout)
    const outer = JSON.parse(streams.stdout.write.mock.calls[1].arguments[0].toString())

    assert.strictEqual(inner.message, 'inner')
    assert.strictEqual(outer.message, 'outer')
    assert.strictEqual(inner.trace_id, outer.trace_id)
    assert.strictEqual(inner.parent_id, outer.span_id)
  })

  it('should link logs to the span', async () => {
    await instance.span('work', () => instance.info('step'))

    const log = pop(streams.stdout)
    const span = JSON.parse(streams.stdout.write.mock.calls[1].arguments[0].toString())

    assert.strictEqual(log.message, 'step')
    assert.strictEqual(log.trace_id, span.trace_id)
    assert.strictEqual(log.span_id, span.span_id)
  })

  it('should continue current trace', async () => {
    const context = create()

    await run(context, async () => await instance.span('work', () => null))

    assert.partialDeepStrictEqual(pop(streams.stdout), {
      trace_id: context.traceId,
      parent_id: context.spanId
    })
  })

  it('should rethrow and mark status on failure', async () => {
    const oops = new Error('oops')

    await assert.rejects(instance.span('work', () => Promise.reject(oops)), oops)

    const subject = pop(streams.stdout)
    assert.partialDeepStrictEqual(subject, { severity: 'TRACE', message: 'work', status: 'error' })
    assert.strictEqual(typeof subject['duration'], 'number')
  })

  it('should write span kind', async () => {
    await instance.span({ name: 'handle', kind: 'server' }, () => null)

    assert.partialDeepStrictEqual(pop(streams.stdout), { kind: 'server' })
  })

  it('should omit internal kind', async () => {
    await instance.span({ name: 'step', kind: 'internal' }, () => null)

    const entry = pop(streams.stdout)

    assert.strictEqual('kind' in entry, false)
  })

  it('should suppress span entries above trace level', async () => {
    instance.configure({ level: 'debug' })

    const result = await instance.span('quiet', () => 'done')

    assert.strictEqual(result, 'done')
    assert.strictEqual(pop(streams.stdout), undefined)
  })

  it('should not write span entries of unsampled traces', async () => {
    sampling({ sample: 0 })

    const result = await instance.span('unsampled', () => 'done')

    assert.strictEqual(result, 'done')
    assert.strictEqual(pop(streams.stdout), undefined)
  })

  it('should stamp trace_id into logs of unsampled traces', async () => {
    sampling({ sample: 0 })

    await instance.span('unsampled', () => instance.info('step'))

    const log = pop(streams.stdout)

    assert.strictEqual(log.message, 'step')
    assert.match(log.trace_id, /^[\da-f]{32}$/)
  })
})

function pop (channel: any): any {
  const buffer = channel.write.mock.calls[0]?.arguments[0] as Buffer

  if (buffer === undefined)
    return undefined

  return JSON.parse(buffer.toString())
}

function resetCalls (target = [streams, context, channels], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
