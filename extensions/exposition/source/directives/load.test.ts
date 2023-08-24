import { load } from './load'

it('should load builtin attributes', async () => {
  const factories = await load()
  const factory = new factories[0]()

  expect(factory.name).toStrictEqual('dev')
})
