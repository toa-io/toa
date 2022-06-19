'use strict'

const framework = require('./framework')

it('should validate extension manifest', async () => {
  await expect(framework.compose(['origins-misformatted'])).rejects.toThrow(/origins\/local must be string/)
})
