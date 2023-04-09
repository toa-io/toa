'use strict'

const { join } = require('node:path')
const { AssertionError } = require('node:assert')
const { generate } = require('randomstring')
const { load } = require('@toa.io/yaml')
const { directory, file } = require('@toa.io/filesystem')
const { sample } = require('@toa.io/generic')
const mock = require('@toa.io/mock')

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../workspace')

const gherkin = mock.gherkin

/** @type {toa.features.Context} */
let context

beforeEach(async () => {
  context = { cwd: await directory.temp() }
})

afterEach(async () => {
  if (context.cwd !== undefined) await directory.remove(context.cwd)
})

describe('Given I have a component {component}', () => {
  const step = gherkin.steps.Gi('I have a component {component}')

  it('should be', () => undefined)

  it('should copy component', async () => {
    const component = sample(['dummies.one', 'dummies.two'])

    await step.call(context, component)

    const path = join(context.cwd, 'components', component)
    const exists = await directory.is(path)

    expect(exists).toStrictEqual(true)
  })
})

describe('Given I have components:', () => {
  const step = gherkin.steps.Gi('I have components:')

  it('should copy components', async () => {
    const table = gherkin.table([['dummies.one'], ['dummies.two']])

    await step.call(context, table)

    const components = table.transpose().raw()[0]

    for (const component of components) {
      const path = join(context.cwd, 'components', component)
      const exists = await directory.is(path)

      expect(exists).toStrictEqual(true)
    }
  })

  it('should throw if non existent component', async () => {
    const table = gherkin.table([['non.existent']])

    await expect(step.call(context, table)).rejects.toThrow('does not exists')
  })
})

describe('Given I have a context with:', () => {
  const step = gherkin.steps.Gi('I have a context with:')

  let path

  beforeEach(async () => {
    path = join(context.cwd, 'context.toa.yaml')
  })

  it('should create context yaml file', async () => {
    await step.call(context)

    await expect(load(path)).resolves.not.toThrow()
  })

  it('should add additions', async () => {
    const key = generate()
    const value = generate()
    const additions = key + ': ' + value

    await step.call(context, additions)

    const contents = await load(path)

    expect(contents[key]).toStrictEqual(value)
  })
})

describe('Given I have a context', () => {
  const step = gherkin.steps.Gi('I have a context')

  let path

  beforeEach(async () => {
    path = join(context.cwd, 'context.toa.yaml')
  })

  it('should create context yaml file', async () => {
    await step.call(context)

    await expect(load(path)).resolves.not.toThrow()
  })
})

describe('Given I have integration samples', () => {
  const step = gherkin.steps.Gi('I have integration samples')

  it('should be', async () => undefined)

  it('should create samples directory', async () => {
    await step.call(context)

    const path = join(context.cwd, 'samples')

    expect(await directory.is(path)).toStrictEqual(true)
  })
})

describe('Then I have an environment with:', () => {
  const step = gherkin.steps.Th('I have an environment with:')

  let envFile

  beforeEach(() => {
    envFile = join(context.cwd, '.env')
  })

  it('should be', async () => undefined)

  it('should fail if .env file does not exists', async () => {
    await expect(step.call(context, '')).rejects.toThrow('ENOENT')
  })

  it('should fail if .env doest not contain one of the lines', async () => {
    const line = generate()
    const lines = [line, generate()].join('\n')

    await file.write(envFile, line + '\n')

    await expect(step.call(context, lines)).rejects.toThrow(AssertionError)
  })

  it('should pass if .env contain all lines', async () => {
    const searchLines = [generate(), generate()]
    const searchText = searchLines.join('\n')
    const existingLines = [generate(), ...searchLines, generate()]
    const existingText = existingLines.join('\n')

    await file.write(envFile, existingText)

    await expect(step.call(context, searchText)).resolves.not.toThrow()
  })
})

describe('Then I update environment value with:', () => {
  const step = gherkin.steps.Th('I update environment value with:')

  let envFile

  beforeEach(() => {
    envFile = join(context.cwd, '.env')
  })

  it('should be', async () => undefined)

  it('should fail if .env file does not exists', async () => {
    await expect(step.call(context, '')).rejects.toThrow('ENOENT')
  })

  it('should update .env file', async () => {
    const updatedText = `A=${generate()}`;
    const existLines = [`A=${generate()}`, `B=${generate()}`]
    const existingText = existLines.join('\n')
    await file.write(envFile, existingText)

    await step.call(context, updatedText)
    const resultedTexts = await file.read(envFile);
    expect(resultedTexts.includes(updatedText)).toBe(true);
  })

  it('should remove old value from .env file after update', async () => {
    const updatedText = `A=${generate()}`;
    const replacedValue = `A=${generate()}`;
    const existingLines = [replacedValue, `B=${generate()}`]
    const existingText = existingLines.join('\n')
    await file.write(envFile, existingText)

    await step.call(context, updatedText)
    const resultedTexts = await file.read(envFile);
    expect(resultedTexts.includes(replacedValue)).toBe(false);
  })
})
