import { normalize } from './annotation'

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
})
