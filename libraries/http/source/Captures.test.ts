/* eslint-disable no-template-curly-in-string */

import { Captures } from './Captures'

let captures: Captures

beforeEach(() => {
  captures = new Captures()
})

it('should capture parts values', async () => {
  captures.capture('hello world', 'hello ${{ word }}')

  const word = captures.get('word')

  expect(word).toBe('world')
})

it('should not capture parts of the words', async () => {
  captures.capture('super-hello world', 'hello ${{ word }}')

  const word = captures.get('word')

  expect(word).toBe(undefined)
})
