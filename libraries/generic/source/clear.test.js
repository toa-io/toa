'use strict'

const { generate } = require('randomstring')
const { clear } = require('./')

it('should be', () => {
  expect(clear).toBeDefined()
})

it('should clear null field', () => {
  const name = generate()
  const object = {
    name,
    age: null
  }

  expect(clear(object)).toStrictEqual({ name })
  expect(object.name).toBeDefined()
})

it('should clear undefined field', () => {
  const name = generate()
  const object = {
    name,
    age: undefined
  }

  expect(clear(object)).toStrictEqual({ name })
  expect(object.name).toBeDefined()
})

it('should clear deep', () => {
  const name = generate()
  const desc = generate()
  const background = generate()

  const object = {
    name,
    profile: {
      desc,
      age: null,
      color: {
        background,
        text: null
      }
    }
  }

  expect(clear(object)).toStrictEqual({
    name,
    profile: {
      desc,
      color: {
        background
      }
    }
  })
})
