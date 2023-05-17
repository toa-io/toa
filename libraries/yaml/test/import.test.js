'use strict'

const { resolve } = require('node:path')
const { load } = require('../source')

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

it('should import recursively', async () => {
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

it('should not overwrite existing values', async () => {
  const path = resolve(__dirname, './examples/imports/conflicts/a.yaml')
  const object = await load(path)

  expect(object).toStrictEqual({
    foo: 1,
    baz: 2,
    obj: {
      bar: 1,
      baz: 2
    }
  })
})

it('should import within multidoc files', async () => {
  const path = resolve(__dirname, './examples/imports/multidoc/a.yaml')
  const object = await load.all(path)

  expect(object).toStrictEqual([{ foo: { bar: 1 } }, { qux: 'hello' }])
})

it('should import from upper directories', async () => {
  const path = resolve(__dirname, './examples/imports/inner/inner.yaml')
  const object = await load(path)

  expect(object).toStrictEqual({ inner: 'ok', outer: 'ok' })
})

it('should throw exception if file not found', async () => {
  const path = resolve(__dirname, './examples/imports/wrong/missing.yaml')

  await expect(load(path)).rejects.toThrow('No files matching pattern')
})

it('should import in array element', async () => {
  const path = resolve(__dirname, './examples/imports/arrays/a.yaml')
  const object = await load(path)

  expect(object).toStrictEqual({
    array: [{
      configuration: {
        b: 1
      }
    }]
  })
})
