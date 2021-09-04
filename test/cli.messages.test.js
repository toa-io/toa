'use strict'

const randomstring = require('randomstring')

const { CLI, Context } = require('./framework')

let context, cli, collection

beforeAll(async () => {
  context = new Context({ storage: 'mongodb' })

  await context.setup()

  collection = context.storage.collection('messages', 'messages')
  cli = new CLI('messages')
})

afterAll(async () => {
  await context.teardown()
})

afterEach(async () => {
  await collection.deleteMany()
})

it('should add message', async () => {
  const message = { text: randomstring.generate() }
  const [output, error] = await cli.invoke('add', message)

  expect(output).toBeDefined()
  expect(error).not.toBeDefined()

  expect(typeof output.id).toBe('string')

  const result = await collection.findOne()

  expect(result).toBeDefined()
  expect(result).toMatchObject(message)
  expect(typeof result._id).toBe('string')
  expect(result._id).toBe(output.id)
})

it('should throw on invalid input', async () => {
  cli.silent = true

  const [output, error] = await cli.invoke('add', { oops: 'nope' }, null)

  expect(output).not.toBeDefined()
  expect(error).toBeDefined()
})

it('should get message', async () => {
  const message = { text: randomstring.generate() }
  const [created] = await cli.invoke('add', message)
  const [output] = await cli.invoke('get', null, `{criteria:'id==${created.id}'}`)

  expect(output.id).toBe(created.id)
})

it('should throw when input is not null', async () => {
  cli.silent = true

  const [output, error] = await cli.invoke('get', { not: 'null' }, '{criteria:id==1}')

  expect(output).not.toBeDefined()
  expect(error).toBeDefined()
})

it('should update message', async () => {
  const message = { text: randomstring.generate() }
  const [created] = await cli.invoke('add', message)

  const update = { text: randomstring.generate() }

  await cli.invoke('update', update, `{criteria:'id==${created.id}'}`)

  const [output] = await cli.invoke('get', null, `{criteria:'id==${created.id}'}`)

  expect(output.id).toBe(created.id)
  expect(output.text).toBe(update.text)
})

describe('find', () => {
  let messages

  const translate = (message) => {
    const { _id: id, ...rest } = message
    return { id, ...rest }
  }

  beforeEach(async () => {
    messages = Array.from(Array(5))
      .map((_, index) => ({ _id: `id${index}`, text: randomstring.generate(), timestamp: index }))

    const { acknowledged } = await collection.insertMany(messages)

    expect(acknowledged).toBeTruthy()
  })

  it('should find messages', async () => {
    const [output] = await cli.invoke('find')

    const expected = messages.map(translate)

    expect(Array.isArray(output.messages)).toBeTruthy()
    expect(output.messages).toMatchObject(expected)
  })

  it('should find with criteria', async () => {
    const [output] = await cli.invoke('find', null, '{criteria:\'id==id1,id==id2\'}')

    const expected = messages
      .filter((message) => message._id === 'id1' || message._id === 'id2')
      .map(translate)

    expect(Array.isArray(output.messages)).toBeTruthy()
    expect(output.messages).toMatchObject(expected)
  })

  it('should find with sort', async () => {
    const [output] = await cli.invoke('find', null, '{sort:\'timestamp:desc\'}')

    expect(output.messages).toStrictEqual(messages.reverse().map(translate))
  })

  it('should find with omit, limit', async () => {
    const [output] = await cli.invoke('find', null, '{omit:2,limit:2,sort:\'timestamp:asc\'}')

    const expected = messages.slice(2, 4).map(translate)

    expect(output.messages.length).toBe(2)
    expect(output.messages).toStrictEqual(expected)
  })

  it('should use projection', async () => {
    const [output] = await cli.invoke('find', null, '{projection:\'timestamp\'}')

    const expected = messages.map(({ _id, timestamp }) => ({ id: _id, timestamp }))

    expect(output.messages).toStrictEqual(expected)
  })
})
