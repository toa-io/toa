import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { normalize } from './annotation.js'

describe('normalize', () => {
  it('should expand default shards', async () => {
    const declaration = 'amqp://rmq{0-2}.example.com'
    const annotation = normalize(declaration)

    assert.deepStrictEqual(annotation, {
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

    assert.deepStrictEqual(annotation, {
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

    assert.doesNotThrow(() => normalize(declaration))
  })

  it('should throw if non-uri', async () => {
    const declaration = 'non uri'

    assert.throws(() => normalize(declaration), (error: any) => /must match format/.test(error.message))
  })

  for (const credentials of ['user:pass', 'user', ':pass'])
     it('should throw if uri has credentials', async () => {
      const declaration = `http://${credentials}@localhost`

      assert.throws(() => normalize(declaration), (error: any) => /must not contain credentials/.test(error.message))
    })

  it('should throw if key is not deployable', async () => {
    const declaration = { 'foo bar': 'http://localhost' }

    assert.throws(() => normalize(declaration), (error: any) => /not expected/.test(error.message))
  })
})
