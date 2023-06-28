import { Redis, ClusterOptions } from 'ioredis'

const url = 'redis://localhost'
const options: ClusterOptions = { keyPrefix: 'test', enableReadyCheck: true, lazyConnect: true }
const redis = new Redis(url, options)

it('should get/set', async () => {
  await redis.set('foo', 'bar')
  const bar = await redis.get('foo')

  expect(bar).toStrictEqual('bar')
})
