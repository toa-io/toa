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

  it('should not filter values outside of annotations', () => {
    context['name@staging'] = 'foo'

    normalize(context)

    expect(context['name@staging']).toStrictEqual('foo')
  })

  it('should convolve if environment is given', () => {
    const target = context.annotations.test['target@staging']

    normalize(context, 'staging')

    expect(context.annotations.test.target).toStrictEqual(target)
  })
})
