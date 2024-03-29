import * as http from './HTTP'
import { type Parameter } from './RTD'
import * as schemas from './schemas'
import type * as syntax from './RTD/syntax'
import type * as core from '@toa.io/core'

export class Query {
  private readonly query: syntax.Query
  private readonly closed: boolean = false

  public constructor (query: syntax.Query) {
    if (query.criteria !== undefined) {
      const open = query.criteria[query.criteria.length - 1] === ';'

      if (open) query.criteria = query.criteria.slice(0, -1)
      else this.closed = true
    }

    this.query = query
  }

  public fit (query: http.Query, parameters: Parameter[]): core.Query {
    const error = schemas.querystring.fit(query)

    if (error !== null)
      throw new http.BadRequest('Query ' + error.message)

    this.fitCriteria(query, parameters)
    this.fitRanges(query)
    this.fitSort(query)

    return query as core.Query
  }

  private fitCriteria (query: http.Query, parameters: Parameter[]): void {
    const criteria: string[] = []

    if (this.query.criteria !== undefined)
      criteria.push(this.query.criteria)

    const idx = parameters.findIndex((parameter) => parameter.name === 'id')

    if (idx !== -1) {
      query.id = parameters[idx].value

      parameters.splice(idx, 1)
    }

    if (parameters.length > 0) {
      const chunks = parameters
        .map(({ name, value }) => `${name}==${value}`)
        .join(';')

      criteria.push(chunks)
    }

    if (query.criteria !== undefined)
      if (this.closed) throw new http.BadRequest('Query criteria is closed.')
      else criteria.push(query.criteria)

    switch (criteria.length) {
      case 0:
        break
      case 1:
        query.criteria = criteria[0]
        break
      default:
        query.criteria = '(' + criteria.join(');(') + ')'
        break
    }
  }

  private fitRanges (qs: http.Query): void {
    const query = qs as core.Query

    if (qs.limit !== undefined)
      query.limit = fit(qs.limit, this.query.limit.range, 'limit')
    else
      query.limit = this.query.limit.value

    if (qs.omit !== undefined)
      query.omit = fit(qs.omit, this.query.omit.range, 'omit')
  }

  private fitSort (qs: http.Query): void {
    const query = qs as core.Query

    if (qs.sort === undefined && this.query.sort === undefined)
      return

    const sort = (this.query.sort ?? '') + (qs.sort ?? '')

    query.sort = sort.split(';')
  }
}

function fit (string: string, range: [number, number], name: string): number {
  const number = parseInt(string)

  if (number < range[0] || number > range[1])
    throw new http.BadRequest(`Query ${name} must be between ` +
      `${range[0]} and ${range[1]} inclusive.`)

  return number
}
