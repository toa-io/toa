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

  instance = new Console({ context, streams })
})

it('should be', async () => {
  expect(instance).toBeDefined()
})

describe.each(channels)('%s',
  (severity) => {
    const channel = severity === 'error' ? streams.stderr : streams.stdout

    it('should write', () => {
      instance[severity]('hello')

      expect(channel.write).toBeCalled()

      expect(pop(channel)).toMatchObject({
        severity: severity.toUpperCase(),
        message: 'hello'
      })
    })

    it('should format message', () => {
      instance[severity]('hello %s', 'world')

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

      instance[severity]('hello %s', 'world', attributes)

      expect(pop(channel)).toMatchObject({
        attributes
      })
    })
  })

describe.each(channels)('console instance (%s)', (channel) => {
  it('should print message', () => {
    console[channel]('Hello')
  })

  it('should print attributes', async () => {
    console[channel]('Hello %s', 'again', { foo: 42 })
  })
})

describe('terminal', () => {
  it.each(channels)('should %s', (channel) => {
    process.env.OPENSPAN_TERMINAL = '1'
    console[channel]('Here we go again', { foo: 'okay', bar: 42 })
    process.env.OPENSPAN_TERMINAL = undefined
  })
})

function pop (channel: any): any {
  const buffer = channel.write.mock.calls[0][0] as Buffer

  return JSON.parse(buffer.toString())
}
