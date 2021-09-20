'use strict'

const { load } = require('../src/manifest')

it('should load', async () => {
  await load('./dummies/a', __dirname)

  await expect(load('./dummies/a', __dirname)).resolves.not.toThrow()
  await expect(load('./dummies/b', __dirname)).resolves.not.toThrow()
})

describe('prototype', () => {
  it('should use origin prototype', async () => {
    const manifest = await load('./dummies/a', __dirname)
    expect(manifest.entity.schema.properties.id).toMatchObject({ type: 'string' })
  })

  it('should use prototype chain', async () => {
    const manifest = await load('./dummies/b', __dirname)

    expect(manifest.entity.schema.properties.id).toMatchObject({ type: 'string' })
    expect(manifest.entity.schema.properties.length).toMatchObject({ type: 'integer', maximum: 10 })
    expect(manifest.entity.schema.properties.description).toMatchObject({ type: 'string' })
  })
})
