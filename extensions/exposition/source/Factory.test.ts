import { Factory } from './Factory'

it('should be', async () => {
  expect(Factory).toBeInstanceOf(Function)
})

describe('Tenant', () => {
  let factory: Factory

  beforeEach(() => {
    factory = new Factory()
  })

  it('should be', async () => {
    expect(factory.tenant).toBeInstanceOf(Function)
  })
})
