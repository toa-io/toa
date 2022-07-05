'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')

const { file: { read } } = require('../../')

const FILE = resolve(__dirname, 'read.txt')

it('should be', () => {
  expect(read).toBeDefined()
})

it('should read', async () => {
  const content = await read(FILE)

  expect(content).toStrictEqual('This is a file.\n')
})

it('should throw if path not exists', async () => {
  const file = generate()

  await expect(read(file)).rejects.toThrow('no such file or directory')
})
