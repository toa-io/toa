import { VARIABLE, components, entry } from './map'

afterEach(() => {
  delete process.env[VARIABLE]
})

it('should be empty without the variable', () => {
  expect(entry('a.b')).toBeUndefined()
})

it('should read the variable', () => {
  const values = { 'a.b': { epoch: 'e', schema: { type: 'object' }, defaults: { foo: 1 } } }

  process.env[VARIABLE] = JSON.stringify(values)

  expect(entry('a.b')).toStrictEqual(values['a.b'])
  expect(entry('a.c')).toBeUndefined()
})

it('should follow the variable', () => {
  process.env[VARIABLE] = JSON.stringify({ 'a.b': { epoch: 'e1', schema: {} } })

  expect(entry('a.b')?.epoch).toStrictEqual('e1')

  process.env[VARIABLE] = JSON.stringify({ 'a.b': { epoch: 'e2', schema: {} } })

  expect(entry('a.b')?.epoch).toStrictEqual('e2')
})

it('should list the components by name', () => {
  process.env[VARIABLE] = JSON.stringify({ 'b.two': { epoch: 'e', schema: {} }, 'a.one': { epoch: 'e', schema: {} } })

  expect(components()).toStrictEqual(['a.one', 'b.two'])
})
