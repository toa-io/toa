const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

// noinspection SpellCheckingInspection

'use strict'

const { acronyms } = require('../')

it('should be', () => {
  assert.notStrictEqual(acronyms, undefined)
})

describe('camelcase', () => {
  const camelcase = acronyms.camelcase

  it('should be', () => {
    assert.notStrictEqual(camelcase, undefined)
  })

  it('should return acronym', () => {
    assert.deepStrictEqual(camelcase('Something'), 'So')
    assert.deepStrictEqual(camelcase('SomethingElse'), 'SoEl')
  })

  it('should return with given part length', () => {
    assert.deepStrictEqual(camelcase('SomethingElse', 3), 'SomEls')
  })

  it('should handle too short', () => {
    assert.deepStrictEqual(camelcase('SomethingElse', 5), 'SometElse')
  })
})
