'use strict'

const { resolve } = require('node:path')
const mock = require('@toa.io/libraries/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
const { set } = require('../directory')

const gherkin = mock.gherkin
const ROOT = resolve(__dirname, '../../../../')

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
})

describe('set', () => {
  it('should be', () => {
    expect(set).toBeInstanceOf(Function)
  })

  it('should set cwd', () => {
    const path = resolve(ROOT, './features')
    const context = {}

    set(context, path)

    expect(context.cwd).toStrictEqual(path)
    expect(process.cwd()).toStrictEqual(path)
  })
})
