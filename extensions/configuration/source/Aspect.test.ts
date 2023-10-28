import { Aspect } from './Aspect'

it('should return value', async () => {
  const configuration = {
    foo: 'bar',
    bar: {
      baz: 'quux'
    }
  }

  const aspect = new Aspect(configuration)

  expect(aspect.invoke(['foo'])).toStrictEqual(configuration.foo)
  expect(aspect.invoke(['bar', 'baz'])).toStrictEqual(configuration.bar.baz)
})
