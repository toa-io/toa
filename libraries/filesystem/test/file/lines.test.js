'use strict'

const { resolve } = require('node:path')
const { file: { lines } } = require('../../')

const FILE = resolve(__dirname, 'lines.txt')

it('should be', () => {
  expect(lines).toBeDefined()
})

it('should read lines', async () => {
  const strings = await lines(FILE)

  expect(strings).toStrictEqual(['This is the first line.', 'And this is the second one.', ''])
})
