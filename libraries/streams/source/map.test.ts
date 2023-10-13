import { Readable } from 'node:stream'
import { map } from './map'

it('should map', async () => {
  const stream = Readable.from(generate())
  const mapped = map(stream, (num) => num * 2)
  const nums = []

  for await (const num of mapped)
    nums.push(num)

  expect(nums).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
})

function * generate (): Generator<number> {
  for (let i = 0; i < 10; i++)
    yield i
}
