'use strict'

const { generate } = require('randomstring')
const { newid } = require('@toa.io/gears')
const { exceptions: { codes } } = require('@toa.io/core')

const framework = require('./framework')

let composition, remote, messages

beforeAll(async () => {
  composition = await framework.compose(['messages', 'credits'])
  remote = await framework.remote('messages.messages')
  messages = await framework.mongodb.connect('messages.messages')
})

afterAll(async () => {
  if (messages) await messages.disconnect()
  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()
})

describe('not found', () => {
  it('should throw if target is an entry', async () => {
    await expect(remote.invoke('get', { query: { criteria: 'id==1' } }))
      .rejects.toMatchObject({ code: codes.StateNotFound })
  })

  it('should return empty array if target is a set', async () => {
    const { output } = await remote.invoke('find', { query: { criteria: 'id==1', limit: 10 } })

    expect(output).toStrictEqual([])
  })

  it('should init state if no query', async () => {
    const reply = await remote.invoke('add', { input: { sender: newid(), text: '123' } })

    expect(reply).toStrictEqual({ output: { id: expect.any(String) } })
  })

  it('should return matching query', async () => {
    const sender = newid()
    const text = generate()
    await remote.invoke('add', { input: { sender, text } })
    const { output } = await remote.invoke('observe', { query: { criteria: 'sender==' + sender } })

    expect(output.text).toBe(text)
  })

  it('should return projection', async () => {
    const text = generate()
    const { output: created } = await remote.invoke('add', { input: { sender: newid(), text } })
    const reply = await remote.invoke('observe', { query: { id: created.id, projection: 'text' } })

    expect(reply.output).toStrictEqual({ id: created.id, text, _version: 1 })
  })

  it('should throw if query passed when declaration.query = false', async () => {
    await expect(remote.invoke('add', { input: { sender: '1', text: '123' }, query: { criteria: 'id==1' } }))
      .rejects.toMatchObject({ code: codes.RequestContract, keyword: 'additionalProperties', property: 'query' })
  })

  it('should throw if no query passed when declaration.query = true', async () => {
    await expect(remote.invoke('find', {}))
      .rejects.toMatchObject({ code: codes.RequestContract, keyword: 'required', property: 'query' })
  })

  it('should add or update based on query', async () => {
    const id1 = newid()
    const created = await remote.invoke('transit', { input: { sender: id1, text: '1' } })

    expect(created.output.id).toBeDefined()

    const id2 = newid()
    const updated = await remote.invoke('transit',
      { input: { sender: id2, text: '2' }, query: { criteria: 'id==' + created.output.id } })

    expect(updated.output.id).toBe(created.output.id)

    const reply = await remote.invoke('get', { query: { criteria: 'id==' + created.output.id } })

    expect(reply.output).toMatchObject({ sender: id2, text: '2' })
  })

  it('should find by id', async () => {
    const ids = (await Promise.all([1, 2, 3, 4, 5].map((i) =>
      remote.invoke('add', { input: { sender: newid(), text: 't' + i } })))).map((reply) => reply.output.id)

    // there is a deterministic unit test for core/query class
    const one = ids[Math.round(ids.length * Math.random() * 0.9)]

    const reply = await remote.invoke('get', { query: { id: one } })

    expect(reply.output.id).toBe(one)
  })

  describe('validation', () => {
    it('should throw if id does not match pattern', async () => {
      await expect(remote.invoke('get', { query: { id: 1 } }))
        .rejects.toMatchObject({ keyword: 'pattern', property: 'query/id' })

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

    it('should throw if limit is not positive integer', async () => {
      await expect(remote.invoke('find', { query: { limit: 'foo' } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/limit' })

      await expect(remote.invoke('find', { query: { limit: -1 } }))
        .rejects.toMatchObject({ keyword: 'minimum', property: 'query/limit' })

      await expect(remote.invoke('find', { query: { limit: 0.5 } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/limit' })
    })

    it('should throw if limit is omitted', async () => {
      await expect(remote.invoke('find', { query: { omit: 10 } }))
        .rejects.toMatchObject({ keyword: 'required' })
    })

    it('should throw if omit is not positive integer', async () => {
      await expect(remote.invoke('find', { query: { omit: 'foo', limit: 10 } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/omit' })

      await expect(remote.invoke('find', { query: { omit: -1, limit: 10 } }))
        .rejects.toMatchObject({ keyword: 'minimum', property: 'query/omit' })

      await expect(remote.invoke('find', { query: { omit: 0.5, limit: 10 } }))
        .rejects.toMatchObject({ keyword: 'type', property: 'query/omit' })
    })
  })
})
