import { parse, type Configuration } from './Configuration'

const rest: Omit<Configuration, 'key' | 'condition'> = {
  interval: 1,
  requests: 1
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

it('should convert a key component that takes an argument', () => {
  expect(parse({ key: { segment: 'id' }, ...rest })).toMatchObject({
    key: [
      {
        method: 'segment',
        options: 'id'
      }
    ]
  })
})

it('should convert a mixed key', () => {
  expect(parse({ key: ['route', { segment: 'id' }, 'identity'], ...rest })).toMatchObject({
    key: [
      { method: 'route' },
      { method: 'segment', options: 'id' },
      { method: 'identity' }
    ]
  })
})
