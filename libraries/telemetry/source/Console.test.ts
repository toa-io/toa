import { Console } from './'

let console: Console

const output = {
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

beforeEach(() => {
  jest.clearAllMocks()

  console = new Console(context, output as any)
})

it('should be', async () => {
  expect(console).toBeDefined()
})

describe.each(['debug', 'info', 'warn', 'error'] as Array<'debug' | 'info' | 'warn' | 'error'>)('%s',
  (severity) => {
    const channel = severity === 'error' ? output.stderr : output.stdout

    it('should write', () => {
      console[severity]('hello')

      expect(channel.write).toBeCalled()

      expect(pop(channel)).toMatchObject({
        severity: severity.toUpperCase(),
        message: 'hello'
      })
    })

    it('should format message', () => {
      console[severity]('hello %s', 'world')

      expect(pop(channel)).toMatchObject({
        time: expect.any(String),
        message: 'hello world'
      })
    })

    it('should add context', () => {
      console[severity]('hello')

      expect(pop(channel)).toMatchObject({
        context
      })
    })

    it('should add attributes', async () => {
      const attributes = {
        foo: 'baz',
        baz: 24
      }

      console[severity]('hello %s', 'world', attributes)

      expect(pop(channel)).toMatchObject({
        attributes
      })
    })
  })

function pop (channel: any): any {
  const buffer = channel.write.mock.calls[0][0] as Buffer

  return JSON.parse(buffer.toString())
}
