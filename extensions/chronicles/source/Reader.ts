import { Connector, exceptions } from '@toa.io/core'
import { Refusal } from './Provider.ts'
import type { Label, Provider, Result, View } from './Provider.ts'

/**
 * What `chronicles.query` reads the log through: queries in the provider's dialect, and views
 * made from a statement the provider let a query run.
 */
export class Reader extends Connector {
  public readonly name = 'chronicles'

  private readonly provider: () => Provider

  public constructor(provider: () => Provider) {
    super()

    this.provider = provider
  }

  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    switch (method) {
      case 'describe':
        return await this.describe()
      case 'query':
        return await this.query(args[0])
      case 'define':
        return await this.define(args[0], args[1], args[2])
      case 'drop':
        return await this.drop(args[0])
      default:
        throw new exceptions.MisuseException(`Chronicles have no '${method}'`)
    }
  }

  private async describe(): Promise<Description> {
    const provider = this.provider()

    return {
      dialect: provider.dialect,
      labels: await provider.labels(),
      views: await provider.views()
    }
  }

  private async query(sql: string): Promise<Result | Error> {
    return await refused(async () => await this.provider().query(statement(sql)))
  }

  private async define(
    name: string,
    sql: string,
    refresh?: number
  ): Promise<Error | undefined> {
    const provider = this.provider()

    if (provider.tables.includes(name))
      return new Error('RESERVED', {
        cause: { message: `'${name}' is a table of the log` }
      })

    const select = statement(sql)
    const invalid = await refused(async () => await provider.validate(select))

    if (invalid instanceof Error) return invalid

    const views = await provider.views()

    if (!views.some((view) => view.name === name) && views.length >= MAX_VIEWS)
      return new Error('EXHAUSTED', {
        cause: { message: `A context has at most ${MAX_VIEWS} views` }
      })

    const defined = await refused(
      async () => await provider.define(name, select, refresh)
    )

    return defined instanceof Error ? defined : undefined
  }

  private async drop(name: string): Promise<Error | undefined> {
    const provider = this.provider()
    const views = await provider.views()

    if (!views.some((view) => view.name === name)) return new Error('NOT_FOUND')

    await provider.drop(name)

    return undefined
  }
}

/** One statement: a trailing semicolon is an agent's habit. */
function statement(sql: string): string {
  return sql.trim().replace(/;+$/, '').trim()
}

async function refused<T>(fn: () => Promise<T>): Promise<T | Error> {
  try {
    return await fn()
  } catch (exception) {
    if (exception instanceof Refusal)
      return new Error('REFUSED', { cause: { message: exception.message } })

    throw exception
  }
}

interface Description {
  dialect: string
  labels: Label[]
  views: View[]
}

const MAX_VIEWS = 50
