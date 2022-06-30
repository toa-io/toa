'use strict'

const { generate } = require('randomstring')
const { gherkin } = require('../')

const KEYWORDS = ['Given', 'When', 'Then', 'Before', 'BeforeAll', 'After', 'AfterAll']

describe('steps', () => {
  for (const KEYWORD of KEYWORDS) {
    describe(KEYWORD, () => {
      const expression = gherkin[KEYWORD]

      it('should exist', () => {
        expect(expression).toBeDefined()
      })

      it('should expose steps', () => {
        const sentence = generate()
        const implementation = () => null

        expression(sentence, implementation)

        const step = gherkin.steps[KEYWORD](sentence)

        expect(step).toBeDefined()
        expect(step).toStrictEqual(implementation)
      })

      it('should not lose steps after jest.clearAllMocks()', () => {
        const sentence = generate()
        const implementation = () => null

        expression(sentence, implementation)

        const before = gherkin.steps[KEYWORD](sentence)

        expect(before).toStrictEqual(implementation)

        jest.clearAllMocks()

        let after

        expect(() => (after = gherkin.steps[KEYWORD](sentence))).not.toThrow()

        expect(after).toBeDefined()
        expect(after).toStrictEqual(implementation)
      })

      it('should clear steps', () => {
        const sentence = generate()
        const implementation = () => null

        expression(sentence, implementation)

        const before = gherkin.steps[KEYWORD](sentence)

        expect(before).toStrictEqual(implementation)

        gherkin.clear()

        expect(() => gherkin.steps[KEYWORD](sentence)).toThrow('is not defined')
      })

      it('should throw if step is undefined', () => {
        expect(() => gherkin.steps[KEYWORD](generate())).toThrow(/is not defined/)
      })

      it('should return step by number', () => {
        const implementation1 = () => null
        const implementation2 = () => null

        expression(implementation1)
        expression(implementation2)

        const result1 = gherkin.steps[KEYWORD](0)[0]
        const result2 = gherkin.steps[KEYWORD](1)[0]

        expect(result1).toStrictEqual(implementation1)
        expect(result2).toStrictEqual(implementation2)
      })
    })
  }
})

describe('table', () => {
  const table = gherkin.table
  const data = [[generate(), generate()]]

  it('should exist', () => {
    expect(table).toBeDefined()
  })

  it('should create object', () => {
    const instance = table(data)

    expect(instance).toBeDefined()
  })

  it('should create object with rows()', () => {
    const instance = table(data)

    expect(instance.rows).toBeDefined()

    const rows = instance.rows()

    expect(rows).toStrictEqual(data)
  })

  it('should create object with raw()', () => {
    const instance = table(data)

    expect(instance.raw).toBeDefined()

    const raw = instance.raw()

    expect(raw).toStrictEqual(data)
  })
})
