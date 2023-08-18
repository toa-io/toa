import * as http from '../HTTP'
import { type Parameter } from './Match'
import type * as syntax from './syntax'
import type * as core from '@toa.io/core'

export class Query {
  private readonly query: syntax.Query

  public constructor (query: syntax.Query) {
    range(query.omit)
    range(query.limit)

    this.query = query
  }

  public fit (query: http.Query, parameters: Parameter[]): core.Query {
    this.fitCriteria(query, parameters)
    this.fitRanges(query)
    this.fitSort(query)

    return query as core.Query
  }

  private fitCriteria (query: http.Query, parameters: Parameter[]): void {
    const criteria: string[] = []

    if (this.query.criteria !== undefined)
      criteria.push(group(this.query.criteria))

    if (parameters.length > 0) {
      const chunks = parameters.map(({ name, value }) => `${name}==${value}`)

      criteria.push(...chunks)
    }

    if (query.criteria !== undefined)
      if (criteria.length > 0)
        criteria.push(group(query.criteria))
      else
        criteria.push(query.criteria)

    if (criteria.length > 0)
      query.criteria = criteria.join(';')
  }

  private fitRanges (qs: http.Query): void {
    const query = qs as core.Query

    if (qs.limit !== undefined)
      query.limit = test(qs.limit, this.query.limit.range, 'limit')
    else
      query.limit = this.query.limit.value

    if (qs.omit !== undefined)
      query.omit = test(qs.omit, this.query.omit.range, 'omit')
  }

  private fitSort (qs: http.Query): void {
    const query = qs as core.Query

    if (qs.sort === undefined && this.query.sort === undefined)
      return

    const sort = (this.query.sort ?? '') + (qs.sort ?? '')

    query.sort = sort.split(';')
  }
}

function range (input: syntax.Range): void {
  if (input.value === undefined) input.value = input.range[0]
}

function group (criteria: string): string {
  return '(' + criteria + ')'
}

function test (string: string, range: [number, number], name: string): number {
  const number = parseInt(string)

  if (number < range[0] || number > range[1])
    throw new http.BadRequest(`Query ${name} must be between` +
      `${range[0]} and ${range[1]} inclusive.`)

  return number
}
