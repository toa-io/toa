'use strict'

const { generate } = require('randomstring')

const mock = require('./command.mock')

jest.mock('@toa.io/command', () => mock.command)

const { secrets } = require('../')

it('should be', () => {
  expect(secrets).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('store', () => {
  const store = secrets.store

  it('should be', () => {
    expect(store).toBeDefined()
  })

  it('should create secret', async () => {
    const name = generate()
    const values = { foo: 'bar' }

    mock.command.execute.mockResolvedValueOnce({ exitCode: 0 }) // delete secret
    mock.command.execute.mockResolvedValueOnce({ exitCode: 0 }) // create secret

    await store(name, values)

    const command = `kubectl create secret generic ${name} --from-literal=foo=bar`

    expect(mock.command.execute).toHaveBeenCalledWith(command)
  })
})

describe('get', () => {
  const get = secrets.get

  it('should be', () => {
    expect(get).toBeDefined()
    expect(get).toBeInstanceOf(Function)
  })

  it('should return declaration', async () => {
    const name = generate()
    const declaration = { data: { foo: generate(), bar: generate() } }
    const result = { exitCode: 0, output: JSON.stringify(declaration) }
    const command = `kubectl get secret ${name} -o json`

    mock.command.execute.mockResolvedValueOnce(result)

    const output = await get(name)

    expect(mock.command.execute).toHaveBeenCalledWith(command)
    expect(output).toStrictEqual(declaration)
  })
})
