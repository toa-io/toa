// noinspection SpellCheckingInspection

'use strict'

const { acronyms } = require('../')

it('should be', () => {
  expect(acronyms).toBeDefined()
})

describe('camelcase', () => {
  const camelcase = acronyms.camelcase

  it('should be', () => {
    expect(camelcase).toBeDefined()
  })

  it('should return acronym', () => {
    expect(camelcase('Something')).toStrictEqual('So')
    expect(camelcase('SomethingElse')).toStrictEqual('SoEl')
  })

  it('should return with given part length', () => {
    expect(camelcase('SomethingElse', 3)).toStrictEqual('SomEls')
  })

  it('should handle too short', () => {
    expect(camelcase('SomethingElse', 5)).toStrictEqual('SometElse')
  })
})
