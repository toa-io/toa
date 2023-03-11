'use strict'

const { generate } = require('randomstring')
const { transpose, acronyms } = require('@toa.io/generic')

const { gherkin } = require('../')

beforeEach(() => {
  gherkin.clear()
})

describe('steps', () => {
  const KEYWORDS = ['Given', 'When', 'Then', 'Before', 'BeforeAll', 'After', 'AfterAll']

  for (const KEYWORD of KEYWORDS) {
    describe(KEYWORD, () => {
      const expression = gherkin[KEYWORD]

      it('should be', () => {
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

      it('should not lose steps after clearing jest mocks', () => {
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
        expect(() => gherkin.steps[KEYWORD](generate())).toThrow('is not defined')
      })

      it('should return step by number', () => {
        const implementation1 = () => null
        const implementation2 = () => null

        expression(implementation1)
        expression(implementation2)

        const result1 = gherkin.steps[KEYWORD](0)
        const result2 = gherkin.steps[KEYWORD](1)

        expect(result1).toStrictEqual(implementation1)
        expect(result2).toStrictEqual(implementation2)
      })

      it('should return first call by default', async () => {
        const implementation1 = () => null
        const implementation2 = () => null

        expression(implementation1)
        expression(implementation2)

        const result1 = gherkin.steps[KEYWORD]()
        expect(result1).toStrictEqual(implementation1)
      })

      it('should have acronym', () => {
        const acronym = acronyms.camelcase(KEYWORD)

        expect(gherkin.steps[KEYWORD]).toStrictEqual(gherkin.steps[acronym])
      })
    })
  }
})

describe('table', () => {
  const table = gherkin.table
  const data = [[generate(), generate()], [generate(), generate()]]

  it('should be', () => {
    expect(table).toBeDefined()
  })

  it('should create object', () => {
    const instance = table(data)

    expect(typeof instance).toStrictEqual('object')
  })

  describe('methods', () => {
    it('should have rows()', () => {
      const instance = table(data)

      expect(instance.rows).toBeInstanceOf(Function)

      const rows = instance.rows()

      expect(rows).toStrictEqual([data[1]])
    })

    it('should have raw()', () => {
      const instance = table(data)

      expect(instance.raw).toBeDefined()

      const raw = instance.raw()

      expect(raw).toStrictEqual(data)
    })

    it('should have transpose()', () => {
      const instance = table(data)

      expect(instance.transpose).toBeDefined()

      const transposed = instance.transpose().raw()
      const expected = transpose(data)

      expect(transposed).toStrictEqual(expected)
    })
  })
})
