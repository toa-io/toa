import Schema from '../src/schema'
import * as assets from './schema.assets'

const schema = new Schema(assets.schema)

it('should validate', () => {
  expect(schema.fit(assets.samples.ok.all)).toBeTruthy()
  expect(schema.fit(assets.samples.invalid.type)).toBeFalsy()
  expect(schema.fit(assets.samples.invalid.required)).toBeFalsy()
})

it('should set defaults', () => {
  const sample = { ...assets.samples.ok.required }

  schema.fit(sample)

  expect(sample.baz).toBe(assets.schema.properties.baz.default)
})

it('should forbid additional properties', () => {
  const sample = { extra: 'property', ...assets.samples.ok.all }

  expect(schema.fit(sample)).toBeFalsy()
})

it('should throw on non-object type schema', () => {
  const ctor = () => new Schema({ type: 'number' })

  expect(ctor).toThrow(/must be an object type/)
})
