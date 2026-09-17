import * as assert from 'node:assert'
import { binding, given, then } from 'specumber'

/** What the gateway and its tenants announce over; see `extensions.exposition` `CHANNEL`. */
const DISCOVERY = 'system.exposition.'

@binding()
export class Broker {
  /**
   * A development broker keeps whatever earlier runs declared, so a scenario asserting that
   * nothing is left says what nothing means by clearing it first.
   */
  @given('the `{word}` has no discovery queue')
  public async clear(component: string): Promise<void> {
    for (const name of await this.discovery(component))
      await request(`/queues/%2F/${encodeURIComponent(name)}`, 'DELETE')
  }

  @then('the `{word}` has left no discovery queue')
  public async empty(component: string): Promise<void> {
    const left = await this.discovery(component)

    assert.deepEqual(left, [], `'${component}' left ${left.join(', ')}`)
  }

  private async discovery(component: string): Promise<string[]> {
    const queues = (await request('/queues')) as Array<{ name: string }>

    return queues
      .map(({ name }) => name)
      .filter((name) => name.startsWith(DISCOVERY) && name.endsWith('.' + component))
  }
}

async function request(path: string, method = 'GET'): Promise<unknown> {
  const response = await fetch(MANAGEMENT + path, {
    method,
    headers: { authorization: AUTHORIZATION }
  })

  if (!response.ok)
    throw new Error(`RabbitMQ management ${method} ${path} responded with ${response.status}`)

  if (method !== 'DELETE') return await response.json()
}

const MANAGEMENT = 'http://localhost:31011/api'
const AUTHORIZATION = 'Basic ' + Buffer.from('developer:secret').toString('base64')
