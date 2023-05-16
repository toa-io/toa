'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { sample } = require('@toa.io/generic')

const fixtures = require('./annotation.fixtures')
const { annotation } = require('../')

let input
/** @type {toa.norm.context.dependencies.Instance[]} */ let instances

const call = () => annotation(input, instances)

beforeEach(() => {
  input = clone(fixtures.annotation)
  instances = clone(fixtures.instances)
})

it('sample must be valid', () => {
  expect(call).not.toThrow()
})

it('should must be a function', () => {
  expect(annotation).toBeDefined()
  expect(annotation).toBeInstanceOf(Function)
})

it('should throw on non-existent component', () => {
  input[generate()] = {}

  expect(call).toThrow(/Configuration Schema/)
})

it('should throw if object doesn\'t match schema', () => {
  const keys = Object.keys(input)
  const key = sample(keys)
  const object = input[key]

  object.foo = generate()

  expect(call).toThrow(/foo must be number/)
})
