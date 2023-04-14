'use strict'

const { resolve } = require('node:path')
const { load } = require('../source')

describe('basic', () => {
  it('should import files', async () => {
    const path = resolve(__dirname, './examples/imports/basic/c.yaml')
    const object = await load(path)

    expect(object).toStrictEqual({
      foo: {
        bar: 1,
        baz: 2
      },
      qux: 'hello'
    })
  })
})

describe('nested', () => {
  it('should import files', async () => {
    const path = resolve(__dirname, './examples/imports/nested/c.yaml')
    const object = await load(path)

    expect(object).toStrictEqual({
      result: {
        foo: {
          bar: 1,
          baz: 2
        },
        qux: 'hello'
      }
    })
  })
})

describe('multidoc', () => {
  it('should import files', async () => {
    const path = resolve(__dirname, './examples/imports/multidoc/a.yaml')
    const object = await load.all(path)

    expect(object).toStrictEqual([{ foo: { bar: 1 } }, { qux: 'hello' }])
  })
})
