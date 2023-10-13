import { Readable } from 'node:stream'
import { filter } from './filter'

it('should filter', async () => {
  const stream = Readable.from(generate())
  const odds = filter(stream, (item) => item % 2 === 1)
  const nums = []

  for await (const num of odds)
    nums.push(num)

  expect(nums).toEqual([1, 3, 5, 7, 9])
})

function * generate (): Generator<number> {
  for (let i = 0; i < 10; i++)
    yield i
}
