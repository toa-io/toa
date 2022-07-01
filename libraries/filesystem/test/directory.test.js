'use strict'

const { access, writeFile: write } = require('node:fs/promises')
const { join, resolve } = require('node:path')
const { tmpdir } = require('node:os')
const { generate } = require('randomstring')
const { newid } = require('@toa.io/libraries/generic')

const { directory: { copy, ensure, is, remove, temp, find, glob } } = require('../')

describe('ensure', () => {
  it('should create directory', async () => {
    const path = join(tmpdir(), newid(), newid())

    await ensure(path)

    await expect(access(path)).resolves.not.toThrow()

    await remove(path)
  })

  it('should throw on non-empty directory', async () => {
    await expect(ensure('.')).rejects.toThrow(/must be empty/)
  })
})

describe('is', () => {
  it('should return true if target is directory', async () => {
    const path = join(tmpdir(), newid())

    await ensure(path)

    await expect(is(path)).resolves.toStrictEqual(true)

    await remove(path)
  })

  it('should return false if target is file', async () => {
    const path = join(tmpdir(), newid())

    await write(path, generate())

    await expect(is(path)).resolves.toStrictEqual(false)

    await remove(path)
  })

  it('should throw if not exists', async () => {
    const path = join(tmpdir(), newid())

    await expect(is(path)).rejects.toThrow(/ENOENT: no such file or directory/)
  })
})

describe('remove', () => {
  it('should remove recursively', async () => {
    const root = join(tmpdir(), newid())
    const path = join(root, newid())

    await ensure(path)
    await remove(root)

    await expect(access(root)).rejects.toThrow(/ENOENT: no such file or directory/)
  })
})

describe('temp', () => {
  it('should create directory', async () => {
    const path = await temp()

    await expect(is(path)).resolves.toStrictEqual(true)

    await remove(path)
  })

  it('should create within os.temp()', async () => {
    const path = await temp()
    const tmp = tmpdir()

    expect(path.substring(0, tmp.length)).toStrictEqual(tmp)

    await remove(path)
  })
})

describe('copy', () => {
  it('should copy recursive', async () => {
    const root = await temp()
    const source = join(root, newid())
    const target = join(root, newid())
    const nested = newid()

    expect(source).not.toStrictEqual(target)

    await ensure(join(source, nested))
    await copy(source, target)

    await expect(is(join(target, nested))).resolves.toStrictEqual(true)

    await remove(source)
    await remove(target)
  })
})

describe('find', () => {
  const THIS = resolve(__dirname, '../')

  it('should exist', () => {
    expect(find).toBeDefined()
  })

  it('should find by package name', () => {
    const path = find('@toa.io/libraries', '/')

    expect(path).toStrictEqual(resolve(__dirname, '../../'))
  })

  it('should find by package name with directory', () => {
    const path = find('@toa.io/libraries/filesystem', '/')

    expect(path).toStrictEqual(THIS)
  })

  it('should resolve package by relative path', () => {
    const path = find('../', __dirname)

    expect(path).toStrictEqual(THIS)
  })

  it('should resolve package by relative starts with ./', () => {
    const ref = 'extensions/exposition'
    const root = resolve(__dirname, '../../../')

    const path = find(ref, root)

    expect(path).toStrictEqual(resolve(root, ref))
  })
})

describe('glob', () => {
  it('should exist', () => {
    expect(glob).toBeDefined()
  })

  it('should find by pattern', async () => {
    const expected = ['src', 'test', 'types'].map((dir) => resolve(__dirname, '../', dir))

    const found = await glob(resolve(__dirname, '../*'))

    expect(found).toStrictEqual(expected)
  })
})
