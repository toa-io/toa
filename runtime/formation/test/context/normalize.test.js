'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./normalize.fixtures')
const { normalize } = require('../../src/context/normalize')

let context

beforeEach(() => {
  context = clone(fixtures.context)
})

it('should resolve local version', () => {
  context.runtime = '.'

  normalize(context)

  expect(context.runtime).not.toEqual('.')
  expect(context.runtime.version).toEqual(require('@toa.io/runtime').version)
})

it('should expand registry', () => {
  const base = generate()

  context.registry = base

  normalize(context)

  expect(context.registry).toEqual({
    base
  })
})

describe('environments', () => {
  it('should filter annotations with tags', () => {
    normalize(context)

    expect(context.annotations.test.target).toStrictEqual(fixtures.context.annotations.test.target)
    expect(context.annotations.test['target@staging']).toBeUndefined()
  })

  it('should filter values outside of annotations', () => {
    const key = generate()
    const untagged = generate()
    const tagged = generate()
    const environment = generate()

    context[key] = untagged
    context[key + '@' + environment] = tagged

    normalize(context, environment)

    expect(context[key]).toStrictEqual(tagged)
    expect(context[key + '@' + environment]).toBeUndefined()
  })

  it('should convolve if environment is given', () => {
    const target = context.annotations.test['target@staging']

    normalize(context, 'staging')

    expect(context.annotations.test.target).toStrictEqual(target)
  })

  it('should add environment to context', () => {
    const environment = generate()

    normalize(context, environment)

    expect(context.environment).toStrictEqual(environment)
  })
})
