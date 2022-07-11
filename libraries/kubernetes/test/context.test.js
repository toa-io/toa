'use strict'

const { generate } = require('randomstring')
const mock = require('./command.mock')

jest.mock('@toa.io/libraries/command', () => mock.command)
const { context } = require('../')

it('should be', () => {
  expect(context).toBeDefined()
})

describe('set', () => {
  const set = context.set

  it('should be', () => {
    expect(set).toBeDefined()
    expect(set).toBeInstanceOf(Function)
  })

  it('should set context', async () => {
    const context = generate()

    mock.command.execute.mockResolvedValueOnce({ exitCode: 0 })

    await set(context)

    expect(mock.command.execute).toHaveBeenCalledWith('kubectx ' + context)
  })

  it('should throw on error', async () => {
    const result = { exitCode: 1, error: generate() }

    mock.command.execute.mockResolvedValueOnce(result)

    await expect(set(context)).rejects.toThrow(result.error)
  })
})

describe('get', () => {
  const get = context.get

  it('should be', () => {
    expect(get).toBeDefined()
    expect(get).toBeInstanceOf(Function)
  })

  it('should return current context', async () => {
    const result = { exitCode: 0, output: generate() }

    mock.command.execute.mockResolvedValueOnce(result)

    const context = await get()

    expect(context).toStrictEqual(result.output)
  })

  it('should throw on error', async () => {
    const result = { exitCode: 1, error: generate() }

    mock.command.execute.mockResolvedValueOnce(result)

    await expect(get()).rejects.toThrow(result.error)
  })
})
