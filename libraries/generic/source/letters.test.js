'use strict'

const { letters } = require('../')

describe('up', () => {
  const up = letters.up

  it('should be', () => {
    expect(up).toBeInstanceOf(Function)
  })

  it('should uppercase', () => {
    const lower = 'foo-bar-baz'
    const upper = up(lower)

    expect(upper).toStrictEqual('FOO_BAR_BAZ')
  })
})

describe('down', () => {
  const down = letters.down

  it('should be', () => {
    expect(down).toBeInstanceOf(Function)
  })

  it('should uppercase', () => {
    const upper = 'FOO_BAR_BAZ'
    const lower = down(upper)

    expect(lower).toStrictEqual('foo-bar-baz')
  })
})

describe('capitalize', () => {
  const capitalize = letters.capitalize

  it('should be', () => {
    expect(capitalize).toBeDefined()
  })

  it('should capitalize', () => {
    const input = 'user name'
    const capitalized = 'User name'
    const output = capitalize(input)

    expect(output).toStrictEqual(capitalized)
  })
})
