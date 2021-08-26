'use strict'

const { validate } = require('../src/validate')
const fixtures = require('./validation.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('manifest', () => {
  const properties = ['domain', 'name']
  const defaults = Object.fromEntries(properties.map(value => [value, value])
    .concat([['operations', [{ name: 'op' }]]]))

  for (const property of properties) {
    describe(property, () => {
      const manifest = (value) => ({ ...defaults, [property]: value })
      const oks = ['a', 'foo-bar', 'a1', 'a-1'].map(manifest)

      it('should be ok', () => {
        for (const ok of oks) {
          expect(() => validate(ok)).not.toThrow()
          expect(console.warn).toHaveBeenCalledTimes(0)
        }
      })

      it('should be defined', () => {
        const wrong = manifest(undefined)

        if (property === 'name') {
          expect(() => validate(wrong)).toThrow(/must be defined/)
        }

        if (property === 'domain') {
          validate(wrong)

          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('warn'),
            expect.stringContaining('missing \'domain\' property')
          )
        }
      })

      it('should be a string', () => {
        const wrong = manifest(1)

        expect(() => validate(wrong)).toThrow(/must be a string/)
      })

      it('should match', () => {
        const wrongs = ['-', '0', '0a', '!a', 'foo-', 'A'].map(manifest)

        for (const wrong of wrongs) expect(() => validate(wrong)).toThrow(/must match/)
      })
    })
  }

  describe('entity', () => {
    const manifest = entity => ({ domain: 'foo', name: 'bar', entity, operations: fixtures.operations })

    // it('should be ok if undefined', () => {
    //   const ok = manifest(undefined)
    //
    //   expect(() => validate(ok)).not.toThrow()
    //   expect(console.warn).toHaveBeenCalledTimes(0)
    // })

    describe('schema', () => {
      const schema = schema => manifest({ schema })
      const properties = (properties, required) => schema({ type: 'object', properties, required })
      const property = { foo: { type: 'string' } }

      it('should be ok', () => {
        const ok = properties(property)

        expect(() => validate(ok)).not.toThrow()
        expect(console.warn).toHaveBeenCalledTimes(0)
      })

      it('should throw if no schema', () => {
        const undef = manifest({})
        const nullish = manifest({ schema: null })

        expect(() => validate(undef)).toThrow(/entity has no schema/)
        expect(() => validate(nullish)).toThrow(/entity has no schema/)
        expect(console.warn).toHaveBeenCalledTimes(0)
      })

      describe('$id', () => {
        it('should set default', () => {
          const ok = properties(property)

          validate(ok)

          expect(ok.entity.schema.$id).toBe('http://foo/bar/entity')
        })
      })

      describe('type', () => {
        it('should be ok', () => {
          const ok = schema({ type: 'object', properties: property })

          expect(() => validate(ok)).not.toThrow()
          expect(console.warn).toHaveBeenCalledTimes(0)
        })

        it('should assign default value', () => {
          const ok = schema({ properties: property })

          validate(ok)

          expect(ok.entity.schema.type).toBe('object')
        })
      })

      describe('additionalProperties', () => {
        it('should be ok', () => {
          const ok = schema({ additionalProperties: false, properties: property })

          expect(() => validate(ok)).not.toThrow()
          expect(console.warn).toHaveBeenCalledTimes(0)
        })

        it('should assign default value', () => {
          const ok = schema({ properties: property })

          validate(ok)

          expect(ok.entity.schema.additionalProperties).toBe(false)
        })

        it('should throw if true', () => {
          const ok = schema({ additionalProperties: true, properties: property })

          expect(() => validate(ok)).toThrow(/additional properties/)
        })
      })

      describe('properties', () => {
        it('should throw on unmatched properties', () => {
          const wrong = properties({ _foo: { type: 'string' } })

          expect(() => validate(wrong)).toThrow(/does not match/)
        })

        it('should expand type', () => {
          const ok = properties({ foo: 'string' })

          validate(ok)

          expect(ok.entity.schema.properties.foo).toStrictEqual({ type: 'string' })
        })

        it('should add system properties', () => {
          const property = { foo: 'string' }
          const ok = properties(property)

          validate(ok)

          expect(ok.entity.schema.properties).toStrictEqual({ ...fixtures.system.properties, ...property })
          expect(ok.entity.schema.required).toStrictEqual(fixtures.system.required)
        })
      })
    })
  })

  describe('operations', () => {
    const manifest = (operations, entity) => ({ domain: 'foo', name: 'bar', entity, operations })

    it('should be ok', () => {
      const ok = manifest([{ name: 'op' }])

      expect(() => validate(ok)).not.toThrow()
      expect(console.warn).toHaveBeenCalledTimes(0)
    })

    it('should be defined', () => {
      const wrong = manifest(undefined)

      expect(() => validate(wrong)).toThrow(/has no operations/)
    })

    it('should be array', () => {
      const wrongs = [{}, 'foo', 1].map(wrong => manifest(wrong))

      for (const wrong of wrongs) expect(() => validate(wrong)).toThrow(/must be an array/)
    })

    it('shout be non empty', () => {
      const wrong = manifest([])

      expect(() => validate(wrong)).toThrow(/has no operations/)
    })
  })
})
