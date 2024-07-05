import assert from 'node:assert'
import * as http from './HTTP'
import { type Parameter } from './RTD'
import * as schemas from './schemas'
import { queryable } from './Mapping'
import type { Introspection, Schema } from './Introspection'
import type * as syntax from './RTD/syntax'
import type * as core from '@toa.io/core'

export class Query {
  private readonly query: syntax.Query
  private readonly closed: boolean = false
  private readonly prepend: ',' | ';' = ';'
  private readonly queryable: boolean

  public constructor (query: syntax.Query) {
    this.queryable = queryable(query)

    if (this.queryable) {
      query.omit ??= { value: 0, range: [0, 1000] }
      query.limit ??= { value: 10, range: [1, 100] }

      if (query.criteria !== undefined) {
        // eslint-disable-next-line max-depth
        if (query.criteria.endsWith(';'))
          query.criteria = query.criteria.slice(0, -1)
        else
          this.closed = true

        // eslint-disable-next-line max-depth
        if (query.criteria.startsWith(',') || query.criteria.startsWith(';')) {
          this.prepend = query.criteria[0] as ',' | ';'

          query.criteria = query.criteria.slice(1)
        }
      }
    }

    this.query = query
  }

  public fit (query: http.Query, parameters: Parameter[]): QueryString {
    const qs = this.split(query)

    if (qs.query !== null) {
      const error = schemas.querystring.fit(qs.query)

      if (error !== null)
        throw new http.BadRequest('Query ' + error.message)

      this.fitCriteria(qs.query, parameters)
      this.fitRanges(qs.query)
      this.fitSort(qs.query)
    }

    return {
      query: qs.query as core.Query,
      parameters: qs.parameters
    }
  }

  public explain (introspection: Introspection): Record<string, Schema> | null {
    if (this.query?.parameters === undefined || introspection.input?.type !== 'object')
      return null

    let query: Record<string, Schema> | null = null

    for (const parameter of this.query.parameters) {
      const schema = introspection.input.properties[parameter]

      if (schema !== undefined) {
        query ??= {}
        query[parameter] = schema
      }

      delete introspection.input.properties[parameter]
    }

    return query
  }

  private split (query: http.Query): {
    query: http.Query | null
    parameters: Record<string, string> | null
  } {
    let parameters: Record<string, string> | null = null

    if (this.query?.parameters !== undefined)
      for (const key in query)
        // eslint-disable-next-line max-depth
        if (this.query.parameters.includes(key)) {
          parameters ??= {}
          parameters[key] = query[key] as string

          delete query[key]
        }

    if (!this.queryable)
      query = null!

    return {
      query,
      parameters
    }
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

    assert.ok(this.query.limit !== undefined, 'Query limit must be defined')
    assert.ok(this.query.omit !== undefined, 'Query limit range must be defined')

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

export interface QueryString {
  query: core.Query | null
  parameters: Record<string, string> | null
}
