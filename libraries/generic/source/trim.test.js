'use strict'

const { trim } = require('../')

it('should be', async () => {
  expect(trim).toBeInstanceOf(Function)
})

it('should trim lines', async () => {
  const trimmed = trim('line one\n line two')

  expect(trimmed).toStrictEqual('line one\nline two')
})

it('should trim tabs', async () => {
  const trimmed = trim('line one\n\tline two')

  expect(trimmed).toStrictEqual('line one\nline two')
})

it('should trim input', async () => {
  const trimmed = trim('\nline one\nline two\n\t \t\n')

  expect(trimmed).toStrictEqual('line one\nline two')
})
