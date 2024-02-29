/* eslint-disable no-template-curly-in-string */

import { Captures } from './Captures'

let captures: Captures

beforeEach(() => {
  captures = new Captures()
})

it('should capture parts of the source', async () => {
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

  expect(captures.capture('hey foo foo', 'hey ${{ word }} ${{ word }}'))
    .toEqual([])

  expect(captures.capture('hey foo bar', 'hey ${{ word }} ${{ word }}'))
    .toBe(null)
})

it('should substitute parts of the words', async () => {
  captures.set('host', 'domain.com')

  expect(captures.capture('foo', 'https://${{ host }}/path'))
    .toBe(null)

  expect(captures.capture('https://domain.com/path', 'https://${{ host }}/path'))
    .toEqual([])
})
