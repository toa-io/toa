'use strict'

const { encode, decode } = require('@toa.io/generic')
const { parse } = require('@toa.io/yaml')

const framework = require('./framework')

const cli = framework.cli('./dummies/configured')

const VARNAME = 'TOA_CONFIGURATION_DUMMIES_CONFIGURED'

beforeEach(() => {
  delete process.env[VARNAME]
})

it('should not fail', async () => {
  const result = await cli('configure foo test')

  expect(result.exitCode).toStrictEqual(0)
})

it('should use env', async () => {
  const before = { bar: { b: 5 } }

  process.env[VARNAME] = encode(before)

  const result = await cli('configure foo test')

  const [command, json] = result.stdout.toString().split('=')
  const after = decode(json)
  const expected = { foo: 'test', ...before }

  expect(command).toStrictEqual('export ' + VARNAME)
  expect(after).toStrictEqual(expected)
})

it('should set values', async () => {
  const result = await cli('configure bar.a 3')

  const configuration = { bar: { a: 3 } }
  const command = `export ${VARNAME}=${encode(configuration)}`

  expect(result.stdout).toStrictEqual(command)
})

it('should support equal sign', async () => {
  const result = await cli('configure bar.a=3')

  const configuration = { bar: { a: 3 } }
  const command = `export ${VARNAME}=${encode(configuration)}`

  expect(result.stdout).toStrictEqual(command)
})

it('should throw if no value', async () => {
  await expect(() => cli('configure foo')).rejects.toThrow(/Key value expected/)
})

it('should validate type', async () => {
  await expect(() => cli('configure bar.a test')).rejects.toThrow(/bar\/a must be number/)
})

it('should reset key', async () => {
  process.env[VARNAME] = encode({ foo: 'Bye', bar: { a: 3 } })

  const command = await cli('configure foo --reset')
  const expected = encode({ bar: { a: 3 } })

  expect(command.stdout).toStrictEqual(`export ${VARNAME}=${expected}`)
})

it('should reset key of object type', async () => {
  process.env[VARNAME] = encode({ foo: 'Bye', bar: { a: 3 } })

  const command = await cli('configure bar --reset')
  const expected = encode({ foo: 'Bye' })

  expect(command.stdout).toStrictEqual(`export ${VARNAME}=${expected}`)
})

it('should unset on last key reset', async () => {
  process.env[VARNAME] = encode({ foo: 'Bye' })

  const command = await cli('configure foo --reset')

  expect(command.stdout).toStrictEqual(`unset ${VARNAME}`)
})

it('should not allow additional properties', async () => {
  await expect(() => cli('configure qux 1')).rejects.toThrow(/must NOT have additional property/)
})

it('should reset', async () => {
  process.env[VARNAME] = encode({ foo: 'test' })

  const result = await cli('configure reset')

  expect(result.stdout).toStrictEqual('unset ' + VARNAME)
})

it('should print', async () => {
  const object = { foo: 'test' }

  process.env[VARNAME] = encode(object)

  const result = await cli('configure print')
  const string = result.stdout.toString()

  const output = parse(string)

  expect(output).toStrictEqual(object)
})

it('should print json', async () => {
  const object = { foo: 'test' }

  process.env[VARNAME] = encode(object)

  const result = await cli('configure print --json')
  const string = result.stdout.toString()

  const output = JSON.parse(string)

  expect(output).toStrictEqual(object)
})
