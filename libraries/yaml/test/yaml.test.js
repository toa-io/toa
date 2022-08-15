'use strict'

const path = require('path')
const { directory } = require('@toa.io/libraries/filesystem')
const { readFile } = require('node:fs/promises')
const { generate } = require('randomstring')

const { save, load, dump, parse, split } = require('../')

describe('load', () => {
  it('should return object', async () => {
    const object = await load(path.resolve(__dirname, './yaml.yaml'))

    expect(object.foo).toEqual('bar')
    expect(object.baz).toStrictEqual('.')
  })

  it('should return array', async () => {
    const objects = await load.all(path.resolve(__dirname, './yaml.multi.yaml'))

    expect(objects).toStrictEqual([{ foo: 'bar' }, { baz: 1 }])
  })

  it('should throw on file read error', async () => {
    const attempt = async () => await load(path.resolve(__dirname, './no-file.yaml'))

    await expect(attempt).rejects.toThrow(/ENOENT/)
  })
})

describe('save', () => {
  it('should exist', () => {
    expect(save).toBeDefined()
  })

  it('should save to file', async () => {
    const temp = await directory.temp()
    const location = path.join(temp, 'test.yaml')

    const object = { [generate()]: generate() }

    await save(object, location)

    const loaded = await load(location)

    expect(loaded).toStrictEqual(object)
  })
})

describe('sync', () => {
  it('should return object', () => {
    const object = load.sync(path.resolve(__dirname, './yaml.yaml'))

    expect(object.foo).toEqual('bar')
  })

  it('should throw on file read error', () => {
    const attempt = () => load.sync(path.resolve(__dirname, './no-file.yaml'))

    expect(attempt).toThrow(/ENOENT/)
  })
})

describe('try', () => {
  it('should return object', async () => {
    const object = await load.try(path.resolve(__dirname, './yaml.yaml'))

    expect(object?.foo).toEqual('bar')
  })

  it('should return null on file read error', async () => {
    const object = await load.try(path.resolve(__dirname, './no-file.yaml'))

    expect(object).toBeNull()
  })
})

it('should dump', () => {
  expect(dump({ ok: 1 })).toBe('ok: 1\n')
})

it('should parse ', () => {
  expect(parse('{ok: {foo: 1}}')).toStrictEqual({ ok: { foo: 1 } })
})

it('should split', async () => {
  const file = path.resolve(__dirname, './yaml.multi.yaml')
  const contents = await readFile(file, 'utf8')

  const objects = split(contents)

  expect(objects).toStrictEqual([{ foo: 'bar' }, { baz: 1 }])
})
