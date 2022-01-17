'use strict'

const fixtures = require('./deployment.fixtures')
const mock = fixtures.mock

jest.mock('node:fs/promises', () => mock.fs)
jest.mock('execa', () => mock.execa)
jest.mock('../src/deployment/dependencies', () => mock.dependencies)
jest.mock('../src/deployment/directory', () => mock.directory)
jest.mock('../src/deployment/chart', () => mock.chart)
jest.mock('../src/deployment/values', () => mock.values)

const { Deployment } = require('../src')
const { join } = require('node:path')
const { generate } = require('randomstring')
const { yaml } = require('@toa.io/gears')

let deployment

beforeEach(() => {
  deployment = new Deployment(fixtures.context)
})

describe('export', () => {
  const test = async (arg) => {
    const result = await deployment.export(arg)

    if (arg !== undefined) expect(arg).toBe(mock.directory.directory.mock.calls[0][0])

    const path = mock.directory.directory.mock.results[0].value
    const chart = yaml.dump(mock.chart.chart.mock.results[0].value)
    const values = yaml.dump(mock.values.values.mock.results[0].value)

    expect(mock.fs.writeFile).toHaveBeenNthCalledWith(1, join(path, 'Chart.yaml'), chart)
    expect(mock.fs.writeFile).toHaveBeenNthCalledWith(2, join(path, 'values.yaml'), values)
    expect(result).toBe(path)
  }

  it('should export chart', async () => {
    await test()
  })

  it('should export chart to given path', async () => {
    await test(generate())
  })
})

describe('install', () => {
  let path

  beforeEach(async () => {
    await deployment.install()

    path = mock.directory.directory.mock.results[0].value
  })

  it('should update', () => {
    expect(mock.execa).toHaveBeenNthCalledWith(1, 'helm', ['dependency', 'update', path])
  })

  it('should upgrade', () => {
    expect(mock.execa).toHaveBeenNthCalledWith(2,
      'helm', ['upgrade', fixtures.context.name, '-i', path])
  })

  it('should wait on upgrade', async () => {
    jest.clearAllMocks()

    await deployment.install(true)

    path = mock.directory.directory.mock.results[0].value

    expect(mock.execa).toHaveBeenNthCalledWith(2,
      'helm', ['upgrade', fixtures.context.name, '-i', '--wait', path])
  })

  it('should pipe stdout', () => {
    const update = mock.execa.mock.results[0].value
    const upgrade = mock.execa.mock.results[1].value

    expect(update.stdout.pipe).toHaveBeenCalledWith(process.stdout)
    expect(upgrade.stdout.pipe).toHaveBeenCalledWith(process.stdout)
  })

  it('should clear', () => {
    expect(mock.fs.rm).toHaveBeenCalledWith(path, { recursive: true })
  })
})
