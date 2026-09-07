import assert from 'node:assert'
import { quote } from '@toa.io/generic'
import * as http from './HTTP/index.js'
import { type Parameter } from './RTD/index.js'
import { schemas } from '@toa.io/definitions/extensions.exposition'
import { queryable } from './Mapping.js'
import { take } from './Introspection.js'
import type { Introspection, Schema } from './Introspection.js'
import type * as syntax from './RTD/syntax/index.js'
import type * as core from '@toa.io/core/types'

export class Query {
  public readonly parameterized: boolean

  private readonly query: syntax.Query
  private readonly closed: boolean = false
  private readonly prepend: ',' | ';' = ';'
  private readonly queryable: boolean
  private readonly searchable: boolean

  /** whether a page is taken of what this answers, and so whether `omit` and `limit` apply */
  private readonly paged: boolean

  public constructor(query: syntax.Query, paged = true) {
    this.parameterized = query?.parameters !== undefined
    this.queryable = queryable(query)
    this.searchable = query?.search === true
    this.paged = paged

    if (this.queryable) {
      if (this.paged) {
        query.omit ??= { value: 0, range: [0, 1000] }
        query.limit ??= { value: 10, range: [1, 100] }
      }

      if (query.criteria !== undefined) {
        // eslint-disable-next-line max-depth
        if (query.criteria.endsWith(';')) query.criteria = query.criteria.slice(0, -1)
        else this.closed = true

        // eslint-disable-next-line max-depth
        if (query.criteria.startsWith(',') || query.criteria.startsWith(';')) {
          this.prepend = query.criteria[0] as ',' | ';'

          query.criteria = query.criteria.slice(1)
        }
      }
    }

    this.query = query
  }

  public fit(query: http.Query, parameters: Parameter[]): QueryString {
    const qs = this.split(query)

    if (qs.query !== null) {
      const error = schemas.querystring.fit(qs.query)

      if (error !== null) throw new http.BadRequest('Query ' + error.message)

      this.fitCriteria(qs.query, parameters)

      if (this.paged) this.fitRanges(qs.query)
      else this.refuseRanges(qs.query)

      this.fitSort(qs.query)

      if (this.query.deleted !== undefined)
        (qs.query as core.Query).deleted = this.query.deleted
    }

    return {
      query: qs.query as core.Query,
      parameters: qs.parameters
    }
  }

  /**
   * What the querystring carries: the parameters this method declares, taken out of the
   * input because they are not the body's, and what a queryable method accepts besides.
   *
   * Only what it actually accepts — a criteria the declaration closes is refused, and so is
   * a search where none was asked for.
   */
  /**
   * The querystring parameters this resource declares, which are properties of its own
   * taken out of the input. What selects records is not among them: that is the same of
   * every queryable resource, and `selection` is where it is stated.
   */
  public explain(introspection: Introspection): Record<string, Schema> | null {
    let query: Record<string, Schema> | null = null

    if (this.query?.parameters !== undefined)
      for (const parameter of this.query.parameters) {
        const schema = take(introspection, parameter)

        // eslint-disable-next-line max-depth
        if (schema === undefined) continue

        query ??= {}
        query[parameter] = schema
      }

    return query
  }

  /**
   * What picks the records a call is about, which is the querystring the gateway reads
   * rather than anything the resource declares — the same for every queryable resource,
   * and so not what one says about itself. A procedure states it, because there it is
   * something the caller sends.
   */
  public selection(): Record<string, Schema> | null {
    if (!this.queryable) return null

    const query: Record<string, Schema> = {}

    if (!this.closed)
      query.criteria = keyword(
        'string',
        'What to match, in RSQL: `state==hot`, `rank=gt=5;name==*tea*`.'
      )

    query.sort = keyword(
      'string',
      'What to order by: `rank:desc`, or `rank` for ascending.'
    )

    if (this.paged) {
      query.limit = bounded('How many at once.', this.query.limit!)
      query.omit = bounded('How many to skip.', this.query.omit!)
    }

    if (this.searchable)
      query.search = keyword('string', 'What to search the text index for.')

    return query
  }

  private split(query: http.Query): {
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

    if (!this.queryable) {
      const keys = Object.keys(query)

      if (keys.length > 0)
        throw new http.BadRequest(`Query parameter '${keys[0]}' is not allowed`)

      query = null!
    }

    if (query?.search !== undefined && !this.searchable)
      throw new http.BadRequest('Query search is not allowed')

    return {
      query,
      parameters
    }
  }

  private fitCriteria(query: http.Query, parameters: Parameter[]): void {
    const groups: CriteriaGroup[] = []
    const idx = parameters.findIndex((parameter) => parameter.name === 'id')

    if (idx !== -1) {
      query.id = parameters[idx].value

      parameters.splice(idx, 1)
    }

    if (parameters.length > 0) {
      // a segment may carry `,` `;` `(` `)` `=`, which is criteria grammar when unquoted
      const criteria = parameters
        .map(({ name, value }) => `${name}==${quote(value)}`)
        .join(';')

      groups.push({ criteria, operator: this.prepend })
    }

    if (this.query.criteria !== undefined)
      groups.push({ criteria: this.query.criteria, operator: ';' })

    if (query.criteria !== undefined)
      if (this.closed) throw new http.BadRequest('Query criteria is closed')
      else groups.push({ criteria: query.criteria, operator: WHATEVER })

    if (groups.length > 0)
      query.criteria = groups.reduce((acc, { criteria, operator }, i) => {
        return i === groups.length - 1
          ? `${acc}(${criteria})`
          : `${acc}(${criteria})${operator}`
      }, '')
  }

  /** A route that answers one object is not paged, so a request that pages it is a mistake. */
  private refuseRanges(qs: http.Query): void {
    for (const name of ['omit', 'limit'] as const)
      if (qs[name] !== undefined)
        throw new http.BadRequest(`Query ${name} is not allowed`)
  }

  private fitRanges(qs: http.Query): void {
    const query = qs as core.Query

    assert.ok(this.query.limit !== undefined, 'Query limit must be defined')
    assert.ok(this.query.omit !== undefined, 'Query limit range must be defined')

    if (qs.limit !== undefined)
      query.limit = fit(qs.limit, this.query.limit.range, 'limit')
    else query.limit = this.query.limit.value

    if (qs.omit !== undefined) query.omit = fit(qs.omit, this.query.omit.range, 'omit')
  }

  private fitSort(qs: http.Query): void {
    const query = qs as core.Query

    if (qs.sort === undefined && this.query.sort === undefined) return

    const sort = (this.query.sort ?? '') + (qs.sort ?? '')

    query.sort = sort.split(';')
  }
}

function fit(string: string, range: [number, number], name: string): number {
  const number = parseInt(string)

  if (number < range[0] || number > range[1])
    throw new http.BadRequest(
      `Query ${name} must be between ${range[0]} and ${range[1]} inclusive`
    )

  return number
}

const WHATEVER = ';'

interface CriteriaGroup {
  criteria: string
  operator: ',' | ';'
}

function keyword(type: string, description: string): Schema {
  return { type, description } as unknown as Schema
}

function bounded(description: string, bounds: syntax.Range): Schema {
  const schema: Record<string, unknown> = {
    type: 'integer',
    description,
    minimum: bounds.range[0],
    maximum: bounds.range[1]
  }

  if (bounds.value !== undefined) schema.default = bounds.value

  return schema as unknown as Schema
}

export interface QueryString {
  query: core.Query | null
  parameters: Record<string, string> | null
}
