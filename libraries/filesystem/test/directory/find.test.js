'use strict'

const { resolve, dirname } = require('node:path')

const { directory: { find } } = require('../../')

describe('find', () => {
  const THIS = resolve(__dirname, '../../')
  const LIBRARIES = resolve(__dirname, '../../../')

  it('should exist', () => {
    expect(find).toBeDefined()
  })

  it('should find by package name', () => {
    const path = find('@toa.io/libraries', '/')

    expect(path).toStrictEqual(LIBRARIES)
  })

  it('should find by package name with directory', () => {
    const path = find('@toa.io/libraries/filesystem', '/')

    expect(path).toStrictEqual(THIS)
  })

  it('should resolve package by relative path', () => {
    const path = find('../../', __dirname)

    expect(path).toStrictEqual(THIS)
  })

  it('should resolve package by relative path not starting with .', () => {
    const ref = 'extensions/exposition'
    const root = resolve(__dirname, '../../../../')

    const path = find(ref, root)

    expect(path).toStrictEqual(resolve(root, ref))
  })

  it('should resolve . as current directory', () => {
    const path = find('.', THIS)

    expect(path).toStrictEqual(THIS)
  })

  it('should resolve if path contain indicator', () => {
    const ref = 'extensions/exposition/package.json'
    const root = resolve(__dirname, '../../../../')
    const directory = dirname(resolve(root, ref))

    const path = find(ref, root)

    expect(path).toStrictEqual(directory)
  })
})
