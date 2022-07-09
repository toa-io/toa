'use strict'

const { letters } = require('../')

describe('up', () => {
  const up = letters.up

  it('should be', () => {
    expect(up).toBeInstanceOf(Function)
  })

  it('should uppercase', () => {
    const lower = 'foo-bar'
    const upper = up(lower)

    expect(upper).toStrictEqual('FOO_BAR')
  })
})

describe('down', () => {
  const down = letters.down

  it('should be', () => {
    expect(down).toBeInstanceOf(Function)
  })

  it('should uppercase', () => {
    const upper = 'FOO_BAR'
    const lower = down(upper)

    expect(lower).toStrictEqual('foo-bar')
  })
})
