'use strict'

const sets = require('../src/sets')

describe('same', () => {
  it('should be same', () => {
    expect(sets.same([1, 2, 3], [1, 2, 3])).toBeTruthy()
    expect(sets.same([3, 2, 1], [1, 2, 3])).toBeTruthy()
    expect(sets.same([1, 1, 2, 3], [1, 2, 3, 3])).toBeTruthy()
    expect(sets.same([1, null], [1, null])).toBeTruthy()
  })

  it('should not be same', () => {
    expect(sets.same([1, 2, 3], [1, 2])).toBeFalsy()
    expect(sets.same([1, 2, 3], [1, 2, 4])).toBeFalsy()
  })
})
