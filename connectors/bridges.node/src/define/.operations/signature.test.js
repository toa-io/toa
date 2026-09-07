import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { signature } from './signature.js'

const names = (statement) => statement.params.map((param) => param.name)

describe('function', () => {
  it('should read a declaration', () => {
    function transition(input, object) {}

    assert.deepStrictEqual(signature(transition), {
      type: 'FunctionDeclaration',
      params: [{ name: 'input' }, { name: 'object' }]
    })
  })

  it('should read an async generator', () => {
    async function* observation(input, objects) {}

    assert.deepStrictEqual(names(signature(observation)), ['input', 'objects'])
  })

  it('should read an arrow', () => {
    const observation = (input, objects) => null
    const statement = signature(observation)

    assert.strictEqual(statement.type, 'ArrowFunctionExpression')
    assert.deepStrictEqual(names(statement), ['input', 'objects'])
  })

  it('should read a single parameter arrow', () => {
    // written without parentheses, which a formatter would put back
    const computation = { toString: () => 'input => input' }
    const effect = { toString: () => 'async input => input' }

    assert.deepStrictEqual(names(signature(computation)), ['input'])
    assert.deepStrictEqual(names(signature(effect)), ['input'])
  })

  it('should read no parameters', () => {
    const computation = () => null

    assert.deepStrictEqual(signature(computation).params, [])
  })

  it('should pass over a default with brackets and commas', () => {
    function transition(input = f(1, [2, 3], { a: ')' }), object) {}

    assert.deepStrictEqual(names(signature(transition)), ['input', 'object'])
  })

  it('should pass over strings, templates, comments and regular expressions', () => {
    const observation = (
      input = [')', `${')'}${{ a: '}' }.a}`] /* ) */, // )
      objects = /\)[)]/g
    ) => null

    assert.deepStrictEqual(names(signature(observation)), ['input', 'objects'])
  })

  it('should not name a pattern', () => {
    function transition({ id }, [object], ...rest) {}

    assert.deepStrictEqual(names(signature(transition)), [
      undefined,
      undefined,
      undefined
    ])
  })

  it('should read what types are erased from', () => {
    // what Node leaves of `(input: Input, object: Entity): void`
    const source = 'function transition(input       , object        )        {}'

    assert.deepStrictEqual(names(signature({ toString: () => source })), [
      'input',
      'object'
    ])
  })

  it('should refuse a method', () => {
    const module = {
      transition(input, object) {}
    }

    assert.throws(() => signature(module.transition), /not a function/)
  })
})

describe('class', () => {
  it('should read the methods', () => {
    class Transition {
      async execute(input, object) {}
    }

    assert.deepStrictEqual(signature(Transition), {
      type: 'ClassDeclaration',
      body: {
        body: [
          {
            type: 'ClassMethod',
            key: { name: 'execute' },
            params: [{ name: 'input' }, { name: 'object' }]
          }
        ]
      }
    })
  })

  it('should read past fields, other methods and calls', () => {
    class Observation extends Object {
      #count = 0
      handler = () => this.execute({})
      static ready = /}/

      static async *stream(objects) {
        yield this.execute(`${'}'}`)
      }

      get size() {
        return this.#count / 2
      }

      execute(input, objects = {}) {}
    }

    const statement = signature(Observation)
    const methods = statement.body.body.map((method) => method.key.name)

    assert.deepStrictEqual(methods, ['stream', 'size', 'execute'])
    assert.deepStrictEqual(names(statement.body.body[2]), ['input', 'objects'])
  })
})
