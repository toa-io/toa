const validate = require('../src/validation')

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

      it('should be ok', () => {
        for (const ok of oks) {
          expect(() => validate.manifest(ok)).not.toThrow()
          expect(console.warn).toHaveBeenCalledTimes(0)
        }
      })

      it('should be defined', () => {
        const wrong = manifest(undefined)

        if (property === 'name') { expect(() => validate.manifest(wrong)).toThrow(/must be defined/) }

        if (property === 'domain') {
          validate.manifest(wrong)

          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('warn'),
            expect.stringContaining('missing \'domain\' property')
          )
        }
      })

      it('should be a string', () => {
        const wrong = manifest(1)

        expect(() => validate.manifest(wrong)).toThrow(/must be a string/)
      })

      it('should match', () => {
        const wrongs = ['-', '0', '0a', '!a', 'foo-', 'A'].map(manifest)

        for (const wrong of wrongs) { expect(() => validate.manifest(wrong)).toThrow(/must match/) }
      })
    })
  }

  describe('operations', () => {
    const manifest = (operations) => ({ domain: 'foo', name: 'bar', operations })

    it('should be ok', () => {
      const ok = manifest([{}])

      expect(() => validate.manifest(ok)).not.toThrow()
      expect(console.warn).toHaveBeenCalledTimes(0)
    })

    it('should be defined', () => {
      const wrong = manifest(undefined)

      expect(() => validate.manifest(wrong)).toThrow(/has no operations/)
    })

    it('should be array', () => {
      const wrongs = [{}, 'foo', 1].map(manifest)

      for (const wrong of wrongs) { expect(() => validate.manifest(wrong)).toThrow(/must be an array/) }
    })

    it('shout be non empty', () => {
      const wrong = manifest([])

      expect(() => validate.manifest(wrong)).toThrow(/has no operations/)
    })
  })
})

describe('operation', () => {
  describe('http', () => {
    it('should set default', () => {
      const operation = {}

      validate.operation(operation)

      expect(operation.http).toStrictEqual([null])
    })

    it('should convert to array', () => {
      const http = { path: '/' }
      const operation = { http }

      validate.operation(operation)

      expect(operation.http).toStrictEqual([http])
    })
  })
})
