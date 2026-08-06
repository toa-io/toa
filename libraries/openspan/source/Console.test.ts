import { console, Console } from './'

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

function pop (channel: any): any {
  const buffer = channel.write.mock.calls[0]?.[0] as Buffer

  if (buffer === undefined)
    return undefined

  return JSON.parse(buffer.toString())
}
