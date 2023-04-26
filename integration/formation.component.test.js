// noinspection JSUnresolvedVariable

'use strict'

const { join } = require('node:path')

const { component } = require('@toa.io/norm')

const load = (ref) => component(join(__dirname, ref))

it('should load', async () => {
  await expect(load('dummies/a')).resolves.not.toThrow()
  await expect(load('dummies/b')).resolves.not.toThrow()
})

it('should convolve with TOA_ENV', async () => {
  const env = process.env.TOA_ENV

  const original = await load('dummies/env')

  expect(Object.entries(original.extensions)[0][1]).toStrictEqual({ foo: 'https://production' })

  process.env.TOA_ENV = 'integration'

  const component = await load('dummies/env')

  const entries = Object.entries(component.extensions)
  const origins = entries[0][1]

  expect(origins).toStrictEqual({ foo: 'http://test' })

  process.env.TOA_ENV = env
})

describe('prototype', () => {
  it('should use generic prototype as default', async () => {
    const manifest = await load('./dummies/a')

    expect(manifest.entity.schema.properties.id)
      .toMatchObject({ $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/id' })
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

  it('should throw on declaration conflict', async () => {
    await expect(load('./dummies/event-declaration-conflict'))
      .rejects.toThrow(/merge: conflict/)
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
      transition: 'transit',
      adaptive: false,
      conditioned: false,
      bridge: expect.any(String),
      path: expect.stringMatching(/dummies\/b$/)
    })
  })
})
