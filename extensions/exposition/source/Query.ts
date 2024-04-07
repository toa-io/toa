import * as http from './HTTP'
import { type Parameter } from './RTD'
import * as schemas from './schemas'
import type * as syntax from './RTD/syntax'
import type * as core from '@toa.io/core'

export class Query {
  private readonly query: syntax.Query
  private readonly closed: boolean = false
  private readonly prepend: ',' | ';' = ';'

  public constructor (query: syntax.Query) {
    if (query.criteria !== undefined) {
      if (query.criteria.endsWith(';'))
        query.criteria = query.criteria.slice(0, -1)
      else
        this.closed = true

      if (query.criteria.startsWith(',') || query.criteria.startsWith(';')) {
        this.prepend = query.criteria[0] as ',' | ';'

        query.criteria = query.criteria.slice(1)
      }
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
    const groups: CriteriaGroup[] = []
    const idx = parameters.findIndex((parameter) => parameter.name === 'id')

    if (idx !== -1) {
      query.id = parameters[idx].value

      parameters.splice(idx, 1)
    }

    if (parameters.length > 0) {
      const criteria = parameters
        .map(({ name, value }) => `${name}==${value}`)
        .join(';')

      groups.push({ criteria, operator: this.prepend })
    }

    if (this.query.criteria !== undefined)
      groups.push({ criteria: this.query.criteria, operator: ';' })

    if (query.criteria !== undefined)
      if (this.closed)
        throw new http.BadRequest('Query criteria is closed')
      else
        groups.push({ criteria: query.criteria, operator: WHATEVER })

    if (groups.length > 0)
      query.criteria = groups.reduce((acc, { criteria, operator }, i) => {
        return i === groups.length - 1
          ? `${acc}(${criteria})`
          : `${acc}(${criteria})${operator}`
      }, '')
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
      `${range[0]} and ${range[1]} inclusive`)

  return number
}

const WHATEVER = ';'

interface CriteriaGroup {
  criteria: string
  operator: ',' | ';'
}
