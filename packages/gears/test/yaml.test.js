'use strict'

const path = require('path')

const { yaml } = require('../src/yaml')

describe('load', () => {
  it('should return object', async () => {
    const object = await yaml(path.resolve(__dirname, './yaml.yaml'))

    expect(object?.ok).toBeTruthy()
  })

  it('should throw on file read error', async () => {
    const attempt = async () => await yaml(path.resolve(__dirname, './no-file.yaml'))

    await expect(attempt).rejects.toThrow(/ENOENT/)
  })
})

describe('try', () => {
  it('should return object', async () => {
    const object = await yaml.try(path.resolve(__dirname, './yaml.yaml'))

    expect(object?.ok).toBeTruthy()
  })

  it('should return null on file read error', async () => {
    const object = await yaml.try(path.resolve(__dirname, './no-file.yaml'))

    expect(object).toBeNull()
  })
})
