'use strict'

const { resolve } = require('node:path')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../directory')

const gherkin = mock.gherkin
const ROOT = resolve(__dirname, '../../../')

let context

beforeEach(() => {
  process.chdir(ROOT)

  context = { cwd: ROOT }
})

describe('Given my working directory is {path}:', () => {
  const step = gherkin.steps.Gi('my working directory is {path}')

  const check = (path) => {
    expect(context.cwd).toStrictEqual(path)
    expect(process.cwd()).toStrictEqual(path)
  }

  it('should be', () => undefined)

  it('should set working directory by absolute path', () => {
    const path = resolve(__dirname)

    step.call(context, path)

    check(path)
  })

  it('should set working directory by relative path', () => {
    const relative = './features'
    const path = resolve(ROOT, relative)

    step.call(context, relative)

    check(path)
  })

  it('should recognize toa root', () => {
    const path = resolve(ROOT, './features/steps')

    context.cwd = path
    process.chdir(path)

    step.call(context, '/toa')

    expect(context.cwd).toStrictEqual(ROOT)
    expect(process.cwd()).toStrictEqual(ROOT)
  })
})

describe('Then the file {path} should contain exact line {string}', () => {
  const step = gherkin.steps.Th('the file {path} should contain exact line {string}')
  const chdir = (path) => gherkin.steps.Gi('my working directory is {path}').call(context, path)

  beforeEach(() => {
    chdir(__dirname)
  })

  it('should be', () => undefined)

  it('should fail if line not found', async () => {
    const file = './assets/directory/file1'
    const line = 'Non-existent line'

    const call = step.call(context, file, line)

    await expect(call).rejects.toThrow('Line')
  })

  it('should throw if file not found', async () => {
    const file = './assets/directory/non-existent'
    const line = 'whatever'

    const call = step.call(context, file, line)

    await expect(call).rejects.toThrow('File not found')
  })

  it('it should pass if true', async () => {
    const call = step.call(context, './assets/directory/file1', 'Bar')
    await expect(call).resolves.not.toThrow()
  })

  it('should handle globs', async () => {
    const call = step.call(context, './assets/dir*/file1', 'Foo')

    await expect(call).resolves.not.toThrow()
  })

  it('should throw on ambiguous pattern', async () => {
    const call = step.call(context, './assets/directory/file*', 'whatever')

    await expect(call).rejects.toThrow(/Ambiguous file pattern/)
  })
})
