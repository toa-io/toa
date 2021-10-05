'use strict'

const { id } = require('../runtime/core/src/id')

const framework = require('./framework')

let composition, remote, messages

beforeAll(async () => {
  composition = await framework.compose(['messages', 'credits'])
  remote = await framework.remote('messages.messages')
  messages = await framework.mongodb.connect('messages.messages')
})

afterAll(async () => {
  if (composition) await composition.disconnect()
  if (messages) await messages.disconnect()
})

describe('not found', () => {
  it('should return null if target is an entry', async () => {
    const reply = await remote.invoke('get', { query: { criteria: 'id==1' } })

    expect(reply).toStrictEqual({ output: null })
  })

  it('should return null if target is a set', async () => {
    const reply = await remote.invoke('find', { query: { criteria: 'id==1' } })

    expect(reply).toStrictEqual({ output: null })
  })

  it('should init state if no query', async () => {
    const reply = await remote.invoke('add', { input: { sender: id(), text: '123' } })

    expect(reply).toStrictEqual({ output: { id: expect.any(String) } })
  })

  it('should throw if query passed when declaration.query = false', async () => {
    await expect(remote.invoke('add', { input: { sender: '1', text: '123' }, query: { criteria: 'id==1' } }))
      .rejects.toMatchObject({ code: 10, keyword: 'additionalProperties', property: 'query' })
  })

  it('should throw if no query passed when declaration.query = true', async () => {
    await expect(remote.invoke('find', {}))
      .rejects.toMatchObject({ code: 10, keyword: 'required', property: 'query' })
  })

  describe('no query declaration', () => {
    it('should add or update based on query', async () => {
      const created = await remote.invoke('transit', { input: { sender: '1', text: '1' } })

      expect(created.output.id).toBeDefined()

      const updated = await remote.invoke('transit',
        { input: { sender: '2', text: '2' }, query: { criteria: 'id==' + created.output.id } })

      expect(updated.output.id).toBe(created.output.id)

      const reply = await remote.invoke('get', { query: { criteria: 'id==' + created.output.id } })

      expect(reply.output).toMatchObject({ sender: '2', text: '2' })
    })
  })

  it('should find by id', async () => {
    const ids = (await Promise.all([1, 2, 3, 4, 5].map((i) =>
      remote.invoke('add', { input: { sender: id(), text: 't' + i } })))).map((reply) => reply.output.id)

    // there is a deterministic unit test for core/query class
    const one = ids[Math.round(ids.length * Math.random() * 0.9)]

    const reply = await remote.invoke('get', { query: { id: one } })

    expect(reply.output.id).toBe(one)
  })

  describe('validation', () => {
    it('should throw if id does not match pattern', async () => {
      await expect(remote.invoke('get', { query: { id: 1 } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/id' })

      await expect(remote.invoke('get', { query: { id: 'a0' } }))
        .rejects.toMatchObject({ keyword: 'pattern', property: 'query/id' })
    })

    it('should throw if sort does not match pattern', async () => {
      await expect(remote.invoke('get', { query: { sort: 'asd!' } }))
        .rejects.toMatchObject({ keyword: 'pattern', property: 'query/sort' })

      await expect(remote.invoke('get', { query: { sort: 'asd:5' } }))
        .rejects.toMatchObject({ keyword: 'pattern', property: 'query/sort' })
    })

    it('should throw if projection does not match pattern', async () => {
      await expect(remote.invoke('get', { query: { projection: 'asd!' } }))
        .rejects.toMatchObject({ keyword: 'pattern', property: 'query/projection' })
    })

    it('should throw if omit is not positive integer', async () => {
      await expect(remote.invoke('get', { query: { omit: '1' } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/omit' })

      await expect(remote.invoke('get', { query: { omit: -1 } }))
        .rejects.toMatchObject({ keyword: 'minimum', property: 'query/omit' })

      await expect(remote.invoke('get', { query: { omit: 0.5 } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/omit' })
    })

    it('should throw if limit is not positive integer', async () => {
      await expect(remote.invoke('get', { query: { limit: '1' } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/limit' })

      await expect(remote.invoke('get', { query: { limit: -1 } }))
        .rejects.toMatchObject({ keyword: 'minimum', property: 'query/limit' })

      await expect(remote.invoke('get', { query: { limit: 0.5 } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/limit' })
    })
  })
})
