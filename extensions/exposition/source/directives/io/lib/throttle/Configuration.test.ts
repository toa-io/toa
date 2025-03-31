import { parse, type Configuration } from './Configuration'

const rest: Omit<Configuration, 'key' | 'condition'> = {
  interval: 1,
  requests: 1,
  cooldown: 1
}

it('should convert key', () => {
  const result: Partial<Configuration> = {
    key: [
      {
        method: 'ip'
      }
    ]
  }

  expect(parse({ key: 'ip', ...rest })).toMatchObject(result)
  expect(parse({ key: ['ip'], ...rest })).toMatchObject(result)
})

it('should convert condition', () => {
  expect(parse({ key: ['ip', 'path'], condition: { status: '404' }, ...rest })).toMatchObject({
    condition: [
      {
        method: 'status',
        options: '404'
      }
    ]
  })

  expect(parse({ key: 'ip', condition: { status: '404' }, ...rest })).toMatchObject({
    condition: [
      {
        method: 'status',
        options: '404'
      }
    ]
  })
})
