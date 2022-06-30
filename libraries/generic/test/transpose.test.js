'use strict'

const { transpose } = require('../')

it('should exist', () => {
  expect(transpose).toBeDefined()
})

it('should transpose', () => {
  const array = [[1, 2, 3], [4, 5, 6]]
  const result = transpose(array)

  expect(result).toStrictEqual([[1, 4], [2, 5], [3, 6]])
})

it('should transpose row', () => {
  const array = [1, 2, 3]
  const result = transpose(array)

  expect(result).toStrictEqual([[1], [2], [3]])
})
