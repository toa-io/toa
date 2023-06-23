'use strict'

const { generate } = require('randomstring')

const { execute } = require('../')

it('should be', () => {
  expect(execute).toBeDefined()
  expect(execute).toBeInstanceOf(Function)
})

it('should run command', async () => {
  const process = await execute('echo ok')

  expect(process.exitCode).toStrictEqual(0)
  expect(process.output).toStrictEqual('ok')
})

it('should not throw on error', async () => {
  const command = generate()

  const process = await execute(command)

  expect(process.exitCode).toStrictEqual(127)
  expect(process.error).toContain('not found')
})

it('should pass stdin', async () => {
  const command = 'read test; echo $test'
  const input = generate()

  const process = await execute(command, input)

  expect(process.output).toStrictEqual(input)
})
