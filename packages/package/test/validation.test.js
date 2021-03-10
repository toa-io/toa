'use strict'

const validate = require('../src/validate')
const fixtures = require('./validation.fixtures')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('manifest', () => {
  const properties = ['domain', 'name']
  const defaults = Object.fromEntries(properties.map(value => [value, value]).concat([['operations', [{}]]]))

  for (const property of properties) {
    describe(property, () => {
      const manifest = (value) => ({ ...defaults, [property]: value })
      const oks = ['a', 'foo-bar', 'a1', 'a-1'].map(manifest)

      it('should be ok', async () => {
        for (const ok of oks) {
          await expect(validate.manifest(ok)).resolves.not.toThrow()
          expect(console.warn).toHaveBeenCalledTimes(0)
        }
      })

      it('should be defined', async () => {
        const wrong = manifest(undefined)

        if (property === 'name') {
          await expect(validate.manifest(wrong)).rejects.toThrow(/must be defined/)
        }

        if (property === 'domain') {
          await validate.manifest(wrong)

          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('warn'),
            expect.stringContaining('missing \'domain\' property')
          )
        }
      })

      it('should be a string', async () => {
        const wrong = manifest(1)

        await expect(() => validate.manifest(wrong)).rejects.toThrow(/must be a string/)
      })

      it('should match', async () => {
        const wrongs = ['-', '0', '0a', '!a', 'foo-', 'A'].map(manifest)

        for (const wrong of wrongs) { await expect(validate.manifest(wrong)).rejects.toThrow(/must match/) }
      })
    })
  }

  describe('entity', () => {
    const manifest = entity => ({ domain: 'foo', name: 'bar', entity, operations: fixtures.operations })

    it('should be ok if undefined', async () => {
      const ok = manifest(undefined)

      await expect(validate.manifest(ok)).resolves.not.toThrow()
      expect(console.warn).toHaveBeenCalledTimes(0)
    })

    describe('schema', () => {
      const schema = schema => manifest({ schema })
      const properties = (properties, required) => schema({ properties, required })
      const property = { foo: { type: 'string' } }

      it('should be ok', async () => {
        const ok = properties(property)

        await expect(validate.manifest(ok)).resolves.not.toThrow()
        expect(console.warn).toHaveBeenCalledTimes(0)
      })

      it('should throw if no schema', async () => {
        const undef = manifest({})
        const nullish = manifest({ schema: null })

        await expect(validate.manifest(undef)).rejects.toThrow(/entity has no schema/)
        await expect(validate.manifest(nullish)).rejects.toThrow(/entity has no schema/)
        expect(console.warn).toHaveBeenCalledTimes(0)
      })

      describe('$id', () => {
        it('should throw if not a string', async () => {
          const wrong = manifest({ schema: { $id: 1, properties: property } })

          await expect(() => validate.manifest(wrong)).rejects.toThrow(/must be string/)
        })

        it('should throw if empty string', async () => {
          const wrong = manifest({ schema: { $id: '', properties: property } })

          await expect(() => validate.manifest(wrong)).rejects.toThrow(/can't be empty/)
        })

        it('should set default', async () => {
          const ok = properties(property)

          await validate.manifest(ok)

          expect(ok.entity.schema.$id).toBe('schema://foo/bar/entity')
        })
      })

      describe('type', () => {
        it('should be ok', async () => {
          const ok = schema({ type: 'object', properties: property })

          await expect(validate.manifest(ok)).resolves.not.toThrow()
          expect(console.warn).toHaveBeenCalledTimes(0)
        })

        it('should assign default value', async () => {
          const ok = schema({ properties: property })

          await validate.manifest(ok)

          expect(ok.entity.schema.type).toBe('object')
        })

        it('should throw if not object', async () => {
          const ok = schema({ type: 'number', properties: property })

          await expect(validate.manifest(ok)).rejects.toThrow(/must be an object/)
        })
      })

      describe('additionalProperties', () => {
        it('should be ok', async () => {
          const ok = schema({ additionalProperties: false, properties: property })

          await expect(validate.manifest(ok)).resolves.not.toThrow()
          expect(console.warn).toHaveBeenCalledTimes(0)
        })

        it('should assign default value', async () => {
          const ok = schema({ properties: property })

          await validate.manifest(ok)

          expect(ok.entity.schema.additionalProperties).toBe(false)
        })

        it('should throw if true', async () => {
          const ok = schema({ additionalProperties: true, properties: property })

          await expect(validate.manifest(ok)).rejects.toThrow(/not allowed for entities/)
        })
      })

      describe('properties', () => {
        it('should warn if no properties', async () => {
          const undef = properties(undefined)
          const empty = properties({})

          await validate.manifest(undef)

          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('warn'),
            expect.stringContaining('has no properties')
          )

          console.warn.mockClear()

          await validate.manifest(empty)

          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('warn'),
            expect.stringContaining('has no properties')
          )
        })

        it('should throw on unmatched properties', async () => {
          const wrong = properties({ _foo: { type: 'string' } })

          await expect(validate.manifest(wrong)).rejects.toThrow(/does not match/)
        })

        it('should expand type', async () => {
          const ok = properties({ foo: 'string' })

          await validate.manifest(ok)

          expect(ok.entity.schema.properties.foo).toStrictEqual({ type: 'string' })
        })

        it('should add system properties', async () => {
          const property = { foo: 'string' }
          const ok = properties(property)

          await validate.manifest(ok)

          expect(ok.entity.schema.properties).toStrictEqual({ ...fixtures.system.properties, ...property })
          expect(ok.entity.schema.required).toStrictEqual(fixtures.system.required)
        })
      })
    })
  })

  describe('operations', () => {
    const manifest = (operations, entity) => ({ domain: 'foo', name: 'bar', entity, operations })

    it('should be ok', async () => {
      const ok = manifest([{}])

      await expect(validate.manifest(ok)).resolves.not.toThrow()
      expect(console.warn).toHaveBeenCalledTimes(0)
    })

    it('should be defined', async () => {
      const wrong = manifest(undefined)

      await expect(validate.manifest(wrong)).rejects.toThrow(/has no operations/)
    })

    it('should be array', async () => {
      const wrongs = [{}, 'foo', 1].map(wrong => manifest(wrong))

      for (const wrong of wrongs) { await expect(validate.manifest(wrong)).rejects.toThrow(/must be an array/) }
    })

    it('shout be non empty', async () => {
      const wrong = manifest([])

      await expect(validate.manifest(wrong)).rejects.toThrow(/has no operations/)
    })

    describe('http', () => {
      it('should set default', async () => {
        const operation = {}
        const ok = manifest([operation])

        await validate.manifest(ok)

        expect(operation.http).toStrictEqual([null])
      })

      it('should convert to array', async () => {
        const http = { path: '/' }
        const operation = { http }
        const ok = manifest([operation])

        await validate.manifest(ok)

        expect(operation.http).toStrictEqual([http])
      })
    })

    describe('query', () => {
      const query = query => manifest(
        [{ query }],
        { schema: { properties: { foo: 'string', bar: 'number' } } }
      )

      it('should be ok', async () => {
        const constraint = { criteria: { foo: { format: 'date' } } }
        const undef = manifest([{}], undefined)
        const def = query(constraint)

        await expect(validate.manifest(undef)).resolves.not.toThrow()
        await expect(validate.manifest(def)).resolves.not.toThrow()
        expect(console.warn).toHaveBeenCalledTimes(0)
      })

      describe('criteria', () => {
        it('should expand array', async () => {
          const collapsed = query({ criteria: ['foo', 'bar'] })

          await validate.manifest(collapsed)
          expect(collapsed.operations[0].query.criteria.properties).toEqual({ foo: null, bar: null })
        })

        it('should expand properties array', async () => {
          const collapsed = query({ criteria: { properties: ['foo', 'bar'] } })

          await validate.manifest(collapsed)

          expect(collapsed.operations[0].query.criteria.properties).toEqual({ foo: null, bar: null })
        })

        it('should add $id', async () => {
          const ok = query({ criteria: ['foo'] })

          await validate.manifest(ok)

          expect(ok.operations[0].query.criteria.$id).toBe('schema://foo//bar/query.criteria')
        })
      })
    })
  })
})
