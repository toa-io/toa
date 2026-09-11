import { createServer } from 'node:net'
import { MongoClient } from 'mongodb'
import { operations } from './counters.ts'

/**
 * The compose stack a checkout runs, on the ports `CONTRIBUTING.md` lists. A run adds a vhost and
 * a database per side and removes nothing else.
 */
export class Stack {
  private readonly mongo = new MongoClient(MONGODB, { directConnection: true })

  public async connect(): Promise<void> {
    await this.mongo.connect()
  }

  public async close(): Promise<void> {
    await this.mongo.close()
  }

  /** A vhost with nothing in it: what an earlier block left has nowhere to land. */
  public async reset(side: string): Promise<void> {
    await management('DELETE', `/vhosts/${side}`)
    await management('PUT', `/vhosts/${side}`, {})
    await management('PUT', `/permissions/${side}/${USER}`, {
      configure: '.*',
      write: '.*',
      read: '.*'
    })
  }

  /**
   * Once per run. A database dropped and created again opens every collection's files anew, and
   * a shared server holding thousands of collections runs out of descriptors under that churn.
   */
  public async drop(side: string): Promise<void> {
    await this.mongo.db(side).dropDatabase()
  }

  public async remove(side: string): Promise<void> {
    await management('DELETE', `/vhosts/${side}`)
    await this.mongo.db(side).dropDatabase()
  }

  /** Messages published in the vhost. The management API refreshes it every few seconds. */
  public async published(side: string): Promise<number> {
    const vhost = (await management('GET', `/vhosts/${side}`)) as {
      message_stats?: { publish?: number }
    }

    return vhost.message_stats?.publish ?? 0
  }

  /** Operations sent to the database, as `top` counts them. */
  public async operations(side: string): Promise<number> {
    const { totals } = await this.mongo.db('admin').command({ top: 1 })

    return operations(totals as Record<string, unknown>, side)
  }
}

/** Refuses a port something already listens on, before anything of a run binds it. */
export async function free(ports: number[]): Promise<void> {
  for (const port of ports)
    await new Promise<void>((resolve, reject) => {
      const server = createServer()

      server.once('error', (error: NodeJS.ErrnoException) =>
        reject(
          error.code === 'EADDRINUSE' ? new Error(`Port ${port} is already in use`) : error
        )
      )
      server.listen(port, () => server.close(() => resolve()))
    })
}

async function management(method: string, path: string, body?: object): Promise<unknown> {
  const response = await fetch(MANAGEMENT + path, {
    method,
    headers: { authorization: AUTHORIZATION, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  if (method === 'DELETE' && response.status === 404) return null

  if (!response.ok)
    throw new Error(`RabbitMQ management ${method} ${path} answered ${response.status}`)

  const text = await response.text()

  return text === '' ? null : JSON.parse(text)
}

const USER = 'developer'
const AUTHORIZATION = 'Basic ' + Buffer.from(`${USER}:secret`).toString('base64')
const MANAGEMENT = 'http://localhost:31011/api'
const MONGODB = 'mongodb://developer:secret@localhost:31020/?authSource=admin'

/** How long the management API may take to show what was published. */
export const STATISTICS = 6_000
