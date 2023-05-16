'use strict'

const { resolve } = require('node:path')
const mock = require('@toa.io/mock')

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

  it('should set working directory by absolute path', async () => {
    const path = resolve(__dirname)

    await step.call(context, path)

    check(path)
  })

  it('should set working directory by relative path', async () => {
    const relative = './features'
    const path = resolve(ROOT, relative)

    await step.call(context, relative)

    check(path)
  })

  it('should recognize toa root', async () => {
    const path = resolve(ROOT, './features/steps')

    context.cwd = path
    process.chdir(path)

    await step.call(context, '/toa')

    expect(context.cwd).toStrictEqual(ROOT)
    expect(process.cwd()).toStrictEqual(ROOT)
  })

  it('should recognize toa paths', async () => {
    const expected = resolve(ROOT, 'features/steps')

    await step.call(context, '/toa/features/steps')

    expect(context.cwd).toStrictEqual(expected)
    expect(process.cwd()).toStrictEqual(expected)
  })

  it('should handle glob', async () => {
    const path = resolve(__dirname)
    const expected = resolve(path, './assets/directory')

    context.cwd = path
    process.chdir(path)

    await step.call(context, './assets/dir*')

    expect(context.cwd).toStrictEqual(expected)
    expect(process.cwd()).toStrictEqual(expected)
  })

  it('should throw on ambiguous pattern', async () => {
    const path = resolve(__dirname)

    context.cwd = path
    process.chdir(path)

    const call = step.call(context, './assets/*')

    await expect(call).rejects.toThrow(/Ambiguous pattern/)
  })
})

describe('Then the file {path} should contain exact line {string}', () => {
  const step = gherkin.steps.Th('the file {path} should contain exact line {string}')
  const chdir = (path) => gherkin.steps.Gi('my working directory is {path}').call(context, path)

  beforeEach(async () => {
    await chdir(__dirname)
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

    await expect(call).rejects.toThrow(/Ambiguous pattern/)
  })
})
