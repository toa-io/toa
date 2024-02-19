import { negotiate } from './negotiate'

it('should return acceptable', async () => {
  const accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp'
  const available = ['application/xml', 'text/html']
  const result = negotiate(accept, available)

  expect(result).toBe('text/html')
})

it('should return null if not acceptable', async () => {
  const accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp'
  const available = ['application/json']
  const result = negotiate(accept, available)

  expect(result).toBe(null)
})
