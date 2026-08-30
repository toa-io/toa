import { console, Console, consoleExporter, create, current, exporting, run, sampling } from './'

afterEach(() => {
  sampling()
  exporting([])
})

let instance: Console

const streams: any = {
  stdout: {
    write: jest.fn()
  },
  stderr: {
    write: jest.fn()
  }
}

const context = {
  foo: 'bar',
  baz: 42
}

const channels = ['debug', 'info', 'warn', 'error'] as Array<'debug' | 'info' | 'warn' | 'error'>

beforeEach(() => {
  jest.clearAllMocks()

  instance = new Console({ streams, context })
})

it('should be', async () => {
  expect(instance).toBeDefined()
})

describe.each(channels)('%s',
  (severity) => {
    const channel = severity === 'error' ? streams.stderr : streams.stdout

    it('should write', () => {
      instance[severity]('hello')

      expect(channel.write).toHaveBeenCalled()

      expect(pop(channel)).toMatchObject({
        severity: severity.toUpperCase(),
        message: 'hello'
      })
    })

    it('should format message', () => {
      instance[severity]('hello world')

      expect(pop(channel)).toMatchObject({
        time: expect.any(String),
        message: 'hello world'
      })
    })

    it('should add context', () => {
      instance[severity]('hello')

      expect(pop(channel)).toMatchObject({
        context
      })
    })

    it('should add attributes', async () => {
      const attributes = {
        foo: 'baz',
        baz: 24
      }

      instance[severity]('hello world', attributes)

      expect(pop(channel)).toMatchObject({ attributes })
    })
  })

it('should not print below given level', () => {
  instance.configure({ level: 'warn' })
  instance.info('a')
  instance.error('b')

  expect(pop(streams.stdout)).toBeUndefined()
  expect(pop(streams.stderr)).toBeDefined()
})

it('should consider log() as debug()', async () => {
  instance.log('foo')

  const entry = pop(streams.stdout)

  expect(entry).toMatchObject({ severity: 'DEBUG' })
})

it('should share the singleton between module copies', () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const copy = require('./Console')

    expect(copy.console).toBe(console)
  })
})

describe.each(channels)('console instance (%s)', (channel) => {
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

  expect(pop(streams.stdout)).toMatchObject({
    context: { foo: 'bar', baz: 42, bar: 'foo' }
  })
})

it('should not log undefined attributes', async () => {
  instance.info('hello', undefined)

  const entry = pop(streams.stdout)

  expect('attributes' in entry).toBe(false)
  expect(entry.message).toBe('hello')
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

  expect(entry.attributes).toMatchObject({
    message: 'oops',
    code: 'E_TEST'
  })

  expect(entry.attributes.stack).toContain('Error: oops')
})

it('should serialize Error cause chain', () => {
  const root = new Error('root')
  const error = new Error('wrapper', { cause: root })

  instance.error('Failed', error)

  const entry = pop(streams.stderr)

  expect(entry.attributes.message).toBe('wrapper')
  expect(entry.attributes.cause.message).toBe('root')
  expect(entry.attributes.cause.stack).toContain('Error: root')
})

it('should serialize non-Error cause', () => {
  const error = new Error('wrapper', { cause: 'just a string' })

  instance.error('Failed', error)

  const entry = pop(streams.stderr)

  expect(entry.attributes.cause).toBe('just a string')
})

it('should log null', () => {
  instance.info('foo', { foo: null })
})

describe('tracing', () => {
  it('should stamp trace_id and span_id within context', () => {
    const context = create()

    run(context, () => instance.info('hello'))

    expect(pop(streams.stdout)).toMatchObject({
      trace_id: context.traceId,
      span_id: context.spanId
    })
  })

  it('should not stamp outside of context', () => {
    instance.info('hello')

    const entry = pop(streams.stdout)

    expect('trace_id' in entry).toBe(false)
    expect('span_id' in entry).toBe(false)
  })
})

describe('span', () => {
  // a span that nothing consumes is not created at all
  beforeEach(() => {
    exporting([consoleExporter])
  })

  it('should return task result', async () => {
    const result = await instance.span('task', () => 42)

    expect(result).toBe(42)
  })

  it('should not open a span within an unsampled trace', async () => {
    const context = { ...create(), sampled: false }

    const inner = await run(context, async () => await instance.span('work', () => current()))

    // the context in scope is reused rather than replaced, so there is nothing to propagate
    expect(inner).toBe(context)
    expect(streams.stdout.write).not.toHaveBeenCalled()
  })

  it('should still run the task when nothing consumes spans', async () => {
    exporting([])

    const context = { ...create(), sampled: false }
    const result = await run(context, async () => await instance.span('work', () => 42))

    expect(result).toBe(42)
    expect(streams.stdout.write).not.toHaveBeenCalled()
  })

  it('should write span entry with duration', async () => {
    await instance.span('fetch', async () => await new Promise((resolve) => setTimeout(resolve, 10)))

    const entry = pop(streams.stdout)

    expect(entry).toMatchObject({
      severity: 'TRACE',
      message: 'fetch',
      trace_id: expect.stringMatching(/^[\da-f]{32}$/),
      span_id: expect.stringMatching(/^[\da-f]{16}$/),
      duration: expect.any(Number)
    })

    expect(entry.duration).toBeGreaterThanOrEqual(5)
    expect('status' in entry).toBe(false)
  })

  it('should write attributes', async () => {
    await instance.span('fetch', { url: 'example.com' }, () => null)

    expect(pop(streams.stdout)).toMatchObject({
      attributes: { url: 'example.com' }
    })
  })

  it('should nest spans', async () => {
    await instance.span('outer', async () => {
      await instance.span('inner', () => null)
    })

    const inner = pop(streams.stdout)
    const outer = JSON.parse(streams.stdout.write.mock.calls[1][0].toString())

    expect(inner.message).toBe('inner')
    expect(outer.message).toBe('outer')
    expect(inner.trace_id).toBe(outer.trace_id)
    expect(inner.parent_id).toBe(outer.span_id)
  })

  it('should link logs to the span', async () => {
    await instance.span('work', () => instance.info('step'))

    const log = pop(streams.stdout)
    const span = JSON.parse(streams.stdout.write.mock.calls[1][0].toString())

    expect(log.message).toBe('step')
    expect(log.trace_id).toBe(span.trace_id)
    expect(log.span_id).toBe(span.span_id)
  })

  it('should continue current trace', async () => {
    const context = create()

    await run(context, async () => await instance.span('work', () => null))

    expect(pop(streams.stdout)).toMatchObject({
      trace_id: context.traceId,
      parent_id: context.spanId
    })
  })

  it('should rethrow and mark status on failure', async () => {
    const oops = new Error('oops')

    await expect(instance.span('work', () => Promise.reject(oops))).rejects.toThrow(oops)

    expect(pop(streams.stdout)).toMatchObject({
      severity: 'TRACE',
      message: 'work',
      status: 'error',
      duration: expect.any(Number)
    })
  })

  it('should write span kind', async () => {
    await instance.span({ name: 'handle', kind: 'server' }, () => null)

    expect(pop(streams.stdout)).toMatchObject({ kind: 'server' })
  })

  it('should omit internal kind', async () => {
    await instance.span({ name: 'step', kind: 'internal' }, () => null)

    const entry = pop(streams.stdout)

    expect('kind' in entry).toBe(false)
  })

  it('should suppress span entries above trace level', async () => {
    instance.configure({ level: 'debug' })

    const result = await instance.span('quiet', () => 'done')

    expect(result).toBe('done')
    expect(pop(streams.stdout)).toBeUndefined()
  })

  it('should not write span entries of unsampled traces', async () => {
    sampling({ sample: 0 })

    const result = await instance.span('unsampled', () => 'done')

    expect(result).toBe('done')
    expect(pop(streams.stdout)).toBeUndefined()
  })

  it('should stamp trace_id into logs of unsampled traces', async () => {
    sampling({ sample: 0 })

    await instance.span('unsampled', () => instance.info('step'))

    const log = pop(streams.stdout)

    expect(log.message).toBe('step')
    expect(log.trace_id).toMatch(/^[\da-f]{32}$/)
  })
})

function pop (channel: any): any {
  const buffer = channel.write.mock.calls[0]?.[0] as Buffer

  if (buffer === undefined)
    return undefined

  return JSON.parse(buffer.toString())
}
