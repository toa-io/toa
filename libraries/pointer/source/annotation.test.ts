import { generate } from 'randomstring'
import { normalize } from './annotation'

describe('normalize', () => {
  it('should expand default shards', async () => {
    const declaration = 'amqp://rmq{0-2}.example.com'
    const annotation = normalize(declaration)

    expect(annotation)
      .toStrictEqual({
        '.': [
          'amqp://rmq0.example.com',
          'amqp://rmq1.example.com',
          'amqp://rmq2.example.com'
        ]
      })
  })

  it('should expand shards within array', async () => {
    const declaration = {
      foo: ['amqp://rmq.example.com', 'amqp://rmq{0-2}.example.com']
    }

    const annotation = normalize(declaration)

    expect(annotation)
      .toStrictEqual({
        foo: [
          'amqp://rmq.example.com',
          'amqp://rmq0.example.com',
          'amqp://rmq1.example.com',
          'amqp://rmq2.example.com'
        ]
      })
  })
})

describe('validation', () => {
  it('should pass', async () => {
    const declaration = 'http://localhost'

    expect(() => normalize(declaration))
      .not.toThrow()
  })

  it('should throw if non-uri', async () => {
    const declaration = 'non uri'

    expect(() => normalize(declaration))
      .toThrow('must match format')
  })

  it.each(['user:pass', 'user', ':pass'])('should throw if uri has credentials',
    async (credentials) => {
      const declaration = `http://${credentials}@localhost`

      expect(() => normalize(declaration))
        .toThrow('must not contain credentials')
    })

  it('should throw if key is not deployable', async () => {
    const declaration = { 'foo bar': 'http://localhost' }

    expect(() => normalize(declaration))
      .toThrow('must NOT have additional properties')
  })
})
