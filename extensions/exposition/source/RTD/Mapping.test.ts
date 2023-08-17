import { generate } from 'randomstring'
import { Mapping } from './Mapping'
import { type Parameter } from './Match'

describe('NonQueryable', () => {
  const converter = Mapping.create('POST')

  it('should set body as input', async () => {
    const body = generate()
    const request = converter.fit(body, {}, [])

    expect(request.input).toBe(body)
  })
})

describe('Queryable', () => {
  const converter = Mapping.create('PATCH')

  it('should set body as input', async () => {
    const body = generate()
    const request = converter.fit(body, {}, [])

    expect(request.input).toBe(body)
  })

  it.each(['id', 'criteria', 'omit', 'limit'] as Key[])('should set query.%s', async (key) => {
    const query = { [key]: generate() }
    const request = converter.fit(undefined, query, [])

    expect(request.query?.[key]).toBe(query[key])
  })

  it('should parse sort', async () => {
    const sort = 'foo:desc;bar:asc'
    const request = converter.fit(undefined, { sort }, [])

    expect(request.query?.sort).toEqual(['foo:desc', 'bar:asc'])
  })

  it('should map parameters to criteria', async () => {
    const parameters: Parameter[] = [
      { name: generate(), value: generate() },
      { name: generate(), value: generate() }
    ]

    const request = converter.fit(undefined, {}, parameters)

    expect(request.query?.criteria).toEqual(`${parameters[0].name}==${parameters[0].value};` +
      `${parameters[1].name}==${parameters[1].value}`)
  })

  it('should prepend parameters to criteria', async () => {
    const parameter: Parameter = { name: 'foo', value: 'bar' }
    const query = { criteria: 'baz==qux,qux==bar' }

    const request = converter.fit(undefined, query, [parameter])

    expect(request.query?.criteria).toEqual('foo==bar;(baz==qux,qux==bar)')
  })
})

type Key = 'id' | 'criteria' | 'omit' | 'limit'
