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

  it('should load prototype events', async () => {
    const manifest = await load('./dummies/a', __dirname)
    const event = manifest.events.find((event) => event.label === 'created')

    expect(event).toStrictEqual({
      label: 'created',
      conditional: true,
      subjective: false,
      path: expect.stringMatching(/runtime\/prototype$/),
      bridge: expect.any(String)
    })
  })

  it('should throw on declaration conflict', async () => {
    await expect(load('./dummies/event-declaration-conflict', __dirname))
      .rejects.toThrow(/Merge conflict/)
  })

  it('should throw on duplicate event', async () => {
    await expect(load('./dummies/event-duplicate', __dirname))
      .rejects.toThrow(/Duplicate event/)
  })
})
