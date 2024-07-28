// noinspection JSUnresolvedVariable

'use strict'

const { join } = require('node:path')

const { component } = require('@toa.io/norm')

const load = (ref) => component(join(__dirname, ref))

it('should load', async () => {
  await expect(load('dummies/a')).resolves.not.toThrow()
  await expect(load('dummies/b')).resolves.not.toThrow()
})

describe('prototype', () => {
  it('should use generic prototype as default', async () => {
    const manifest = await load('./dummies/a')

    expect('id' in manifest.entity.schema.properties)
      .toBe(true)
  })

  it('should merge entity', async () => {
    const manifest = await load('./dummies/b')

    expect(manifest.entity.schema.properties.length).toMatchObject({ type: 'integer', maximum: 10 })
    expect(manifest.entity.schema.properties.description).toMatchObject({ type: 'string' })
  })

  it('should merge entity`s required properties', async () => {
    const manifest = await load('./dummies/b')
    expect(manifest.entity.schema.required).toStrictEqual(['length', 'title', 'id'])
  })

  it('should merge operations', async () => {
    const manifest = await load('./dummies/a')

    expect(manifest.operations.transit).toBeDefined()
  })

  it('should merge events', async () => {
    const manifest = await load('./dummies/a')

    expect(manifest.events.created).toStrictEqual({
      conditioned: true,
      subjective: false,
      bridge: expect.any(String),
      binding: expect.any(String),
      path: expect.stringMatching(/runtime\/prototype$/)
    })
  })
})

describe('events', () => {
  it('should provide binding', async () => {
    const manifest = await load('./dummies/a')

    expect(manifest.events.dummy.binding).toMatch(/bindings.amqp/)
  })
})

describe('receivers', () => {
  it('should load', async () => {
    const manifest = await load('./dummies/b')

    expect(manifest.receivers['dummies.a.happened']).toStrictEqual({
      operation: 'transit',
      adaptive: false,
      conditioned: false,
      bridge: expect.any(String),
      path: expect.stringMatching(/dummies\/b$/)
    })
  })
})
