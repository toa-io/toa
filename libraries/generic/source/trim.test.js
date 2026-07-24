'use strict'

const { trim } = require('../')

it('should be', async () => {
  expect(trim).toBeInstanceOf(Function)
})

it('should trim input', async () => {
  const trimmed = trim('\nline one\nline two\n\t \t\n')

  expect(trimmed).toStrictEqual('line one\nline two')
})

it('should trim by first line padding', async () => {
  const trimmed = trim('  line one\n  line two')

  expect(trimmed).toStrictEqual('line one\nline two')
})

it('should preserve relative indentation', async () => {
  const trimmed = trim(`
      agents:
        - provider: cursor
          model: fast
  `)

  expect(trimmed).toStrictEqual(`agents:
  - provider: cursor
    model: fast`)
})

it('should trim tabs by first line padding', async () => {
  const trimmed = trim('\tline one\n\tline two\n\t\tindented')

  expect(trimmed).toStrictEqual('line one\nline two\n\tindented')
})

it('should trim trailing spaces', async () => {
  const trimmed = trim('  line one \n  line two  ')

  expect(trimmed).toStrictEqual('line one\nline two')
})
