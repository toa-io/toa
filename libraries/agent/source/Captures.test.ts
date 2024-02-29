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

it('should substitute multiple times', async () => {
  captures.set('word', 'foo')

  expect(() => captures.capture('hey foo foo', 'hey ${{ word }} ${{ word }}'))
    .not.toThrow()

  expect(() => captures.capture('hey foo bar', 'hey ${{ word }} ${{ word }}'))
    .toThrow('Capture word already with different value: foo')
})
