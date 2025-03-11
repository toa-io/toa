import { annotation } from './schemas'

it('should be ok', () => {
  annotation.validate({
    provider: 'spam',
    from: 'foo@bar.baz'
  })
})

it('should coerce null', () => {
  const schema = {
    provider: 'null',
    from: 'foo@bar.baz'
  }

  annotation.validate(schema)

  expect(schema.provider).toStrictEqual('null')
})
