'use strict'

const { generate } = require('randomstring')
const {
  newid,
  random,
  repeat
} = require('@toa.io/generic')
const { exceptions: { codes } } = require('@toa.io/core')

const framework = require('./framework')

let composition, remote, messages

beforeAll(async () => {
  framework.dev(true)

  composition = await framework.compose(['messages', 'credits'])
  remote = await framework.remote('default.messages')
  messages = await framework.mongodb.connect('default.messages')
})

afterAll(async () => {
  if (messages) await messages.disconnect()
  if (remote) await remote.disconnect()
  if (composition) await composition.disconnect()

  framework.dev(false)
})

it('should init state if no query', async () => {
  const reply = await remote.invoke('add', {
    input: {
      sender: newid(),
      text: '123'
    }
  })

  expect(reply).toStrictEqual({ id: expect.any(String) })
})

it('should return entity matching query', async () => {
  const sender = newid()
  const text = generate()
  await remote.invoke('add', {
    input: {
      sender,
      text
    }
  })
  const output = await remote.invoke('observe', { query: { criteria: 'sender==' + sender } })

  expect(output.text).toBe(text)
})

it('should return projection', async () => {
  const text = generate()
  const sender = newid()
  const created = await remote.invoke('add', {
    input: {
      sender,
      text
    }
  })
  const id = created.id
  const reply = await remote.invoke('observe', {
    query: {
      id,
      projection: ['text']
    }
  })

  expect(reply).toEqual({
    id,
    _version: 1,
    _deleted: null,
    text
  })
})

it('should sort', async () => {
  const sender = newid()
  const times = 5 + random(5)

  expect.assertions(times)

  await repeat((i) => remote.invoke('add', {
    input: {
      sender,
      text: generate(),
      timestamp: i
    }
  }), times)

  const reply = await remote.invoke('find', {
    query: {
      criteria: 'sender==' + sender,
      sort: ['timestamp:desc'],
      limit: 10
    }
  })

  expect(reply.length).toBe(times)

  let previous

  for (const message of reply) {
    if (previous === undefined) {
      previous = message
      continue
    }

    expect(message.timestamp <= previous?.timestamp).toBe(true)
  }
})

it('should throw if query passed when declaration.query = false', async () => {
  const request = {
    input: {
      sender: newid(),
      text: '123'
    },
    query: { criteria: 'id==1' }
  }

  await expect(remote.invoke('add', request)).rejects.toMatchObject({
    code: codes.RequestContract,
    message: 'query must be null'
  })
})

it('should throw if no query passed when declaration.query = true', async () => {
  await expect(remote.invoke('find', {}))
    .rejects.toMatchObject({
      code: codes.RequestContract,
      keyword: 'required',
      property: 'query'
    })
})

it('should add or update based on query', async () => {
  const id1 = newid()
  const created = await remote.invoke('transit', {
    input: {
      sender: id1,
      text: '1'
    }
  })

  expect(created.id).toBeDefined()

  const id2 = newid()
  const updated = await remote.invoke('transit', {
    input: {
      sender: id2,
      text: '2'
    },
    query: { criteria: 'id==' + created.id }
  })

  expect(updated.id).toBe(created.id)

  const reply = await remote.invoke('get', { query: { criteria: 'id==' + created.id } })

  expect(reply).toMatchObject({
    sender: id2,
    text: '2'
  })
})

it('should find by id', async () => {
  const ids = (await Promise.all([1, 2, 3, 4, 5].map((i) => remote.invoke('add', {
    input: {
      sender: newid(),
      text: 't' + i
    }
  })))).map((reply) => reply.id)

  // there is a deterministic unit test for core/query class
  const one = ids[Math.round(ids.length * Math.random() * 0.9)]

  const reply = await remote.invoke('get', { query: { id: one } })

  expect(reply.id).toBe(one)
})

describe('validation', () => {
  it('should throw if id does not match pattern', async () => {
    await expect(remote.invoke('get', { query: { id: 1 } }))
      .rejects.toMatchObject({
        keyword: 'pattern',
        property: 'query/id'
      })

    await expect(remote.invoke('get', { query: { id: 'a0' } }))
      .rejects.toMatchObject({
        keyword: 'pattern',
        property: 'query/id'
      })
  })

  it('should throw if sort does not match pattern', async () => {
    await expect(remote.invoke('find', {
      query: {
        limit: 10,
        sort: 'asd'
      }
    }))
      .rejects.toMatchObject({
        keyword: 'type',
        property: 'query/sort'
      })

    await expect(remote.invoke('find', {
      query: {
        limit: 10,
        sort: ['text:5']
      }
    }))
      .rejects.toMatchObject({
        keyword: 'pattern',
        property: 'query/sort/0'
      })
  })

  it('should throw if projection does not match schema', async () => {
    await expect(remote.invoke('get', { query: { projection: 'asd!' } }))
      .rejects.toMatchObject({
        keyword: 'type',
        property: 'query/projection'
      })
  })

  it('should throw if limit is not positive integer', async () => {
    await expect(remote.invoke('find', { query: { limit: 'foo' } }))
      .rejects.toMatchObject({
        keyword: 'type',
        property: 'query/limit'
      })

    await expect(remote.invoke('find', { query: { limit: -1 } }))
      .rejects.toMatchObject({
        keyword: 'minimum',
        property: 'query/limit'
      })

    await expect(remote.invoke('find', { query: { limit: 0.5 } }))
      .rejects.toMatchObject({
        keyword: 'type',
        property: 'query/limit'
      })
  })

  it('should throw if limit is omitted', async () => {
    await expect(remote.invoke('find', { query: { omit: 10 } }))
      .rejects.toMatchObject({ keyword: 'required' })
  })

  it('should throw if omit is not positive integer', async () => {
    await expect(remote.invoke('find', {
      query: {
        omit: 'foo',
        limit: 10
      }
    }))
      .rejects.toMatchObject({
        keyword: 'type',
        property: 'query/omit'
      })

    await expect(remote.invoke('find', {
      query: {
        omit: -1,
        limit: 10
      }
    }))
      .rejects.toMatchObject({
        keyword: 'minimum',
        property: 'query/omit'
      })

    await expect(remote.invoke('find', {
      query: {
        omit: 0.5,
        limit: 10
      }
    }))
      .rejects.toMatchObject({
        keyword: 'type',
        property: 'query/omit'
      })
  })
})

describe('not found', () => {
  it('should return null on failed object observation', async () => {
    await expect(remote.invoke('get', { query: { criteria: 'id==1' } }))
      .resolves.toStrictEqual(null)
  })

  it('should return empty array if target is a set', async () => {
    const output = await remote.invoke('find', {
      query: {
        criteria: 'id==1',
        limit: 10
      }
    })

    expect(output).toStrictEqual([])
  })
})
