'use strict'

const framework = require('./framework')

let composition, remote, messages

beforeAll(async () => {
  composition = await framework.compose({ dummies: ['messages', 'credits'] })
  remote = await framework.remote('messages.messages')
  messages = await framework.mongodb.connect('messages.messages')
})

afterAll(async () => {
  await composition.disconnect()
  await messages.disconnect()
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
    const reply = await remote.invoke('add', { input: { sender: '1', text: '123' } })

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
      remote.invoke('add', { input: { sender: 's' + i, text: 't' + i } })))).map((reply) => reply.output.id)

    // there is a deterministic unit test for core/contact/query class
    const id = ids[Math.round(ids.length * Math.random() * 0.9)]

    const reply = await remote.invoke('get', { query: { id } })

    expect(reply.output.id).toBe(id)
  })
})
