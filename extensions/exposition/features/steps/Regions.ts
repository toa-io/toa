import * as assert from 'node:assert'
import { setTimeout as delay } from 'node:timers/promises'
import { after, binding, given, then, when } from 'specumber'
import { assert as connect } from 'comq'
import { environment, match } from '@toa.io/generic'
import { load as parse } from 'js-yaml'

/**
 * The far region is this suite, as it is in the convergence suite of the root: it publishes to
 * that region's own broker, and federation carries what it publishes to the one the composition
 * converges on — and back. Which region a process is comes from its environment, and this one
 * has one of those.
 */
@binding()
export class Regions {
  private io: Awaited<ReturnType<typeof connect>> | undefined
  private received: Array<{ id: string; message: Message }> = []
  private variables: string[] = []

  @given('this is the region `{word}`, converging with `{word}`')
  public region(_: string, __: string): void {
    for (const [name, value] of Object.entries(VARIABLES)) {
      environment.set(name, value)
      this.variables.push(name)
    }
  }

  /**
   * Both ends of a component's channel are durable and outlive the run: what a scenario that
   * failed did not read would be read by the next one.
   */
  @given('the `{word}` convergence queues are empty')
  public async purge(id: string): Promise<void> {
    await purge(FAR_MANAGEMENT, `${CHANNEL}.test.${id}`)
    await purge(NEAR_MANAGEMENT, `${CHANNEL}.${id}`)
  }

  /**
   * Bound before anything is written: federation propagates a downstream binding upstream, and
   * until it does, what is published has nowhere to go.
   */
  @given('the region `{word}` is consuming `{word}`')
  public async consuming(_: string, id: string): Promise<void> {
    this.io ??= await connect(FAR)

    await this.io.subscribe(`${CHANNEL}.in`, `${CHANNEL}.test.${id}`, id, (message: Message) => {
      this.received.push({ id, message })
    })
  }

  @when('the region `{word}` writes to `{word}`:')
  public async write(_: string, id: string, yaml: string): Promise<void> {
    this.io ??= await connect(FAR)

    await this.io.route(`${CHANNEL}.out`, id, parse(yaml) as object)
  }

  @then('the region `{word}` is sent `{word}` carrying:')
  public async carrying(region: string, id: string, yaml: string): Promise<void> {
    const expected = parse(yaml)
    const sent = (): Message[] =>
      this.received.filter((one) => one.id === id).map(({ message }) => message)

    for (let i = 0; i < 60 && sent().length === 0; i++) await delay(100)

    assert.notEqual(sent().length, 0, `Nothing of '${id}' reached the region '${region}'`)

    const { carried } = sent().at(-1)!

    assert.ok(
      match(carried, expected),
      `What '${region}' was sent carries ${JSON.stringify(carried)}`
    )
  }

  @after()
  public async cleanup(): Promise<void> {
    await this.io?.close()

    this.io = undefined
    this.received = []

    for (const name of this.variables) environment.delete(name)

    this.variables = []
  }
}

interface Message {
  record: object
  carried?: unknown
}

async function purge(management: string, queue: string): Promise<void> {
  await fetch(`${management}/queues/%2F/${encodeURIComponent(queue)}/contents`, {
    method: 'DELETE',
    headers: { authorization: AUTHORIZATION }
  }).catch(() => undefined)
}

const CHANNEL = 'convergence'

/** what a deployment of the region `eu` is given, where `us` is the other */
const VARIABLES = {
  TOA_REGION: '0',
  TOA_CONVERGENCE_BINDING: '@toa.io/bindings.amqp',
  TOA_CONVERGENCE_BROKERS: 'amqp://localhost:31013',
  TOA_CONVERGENCE_BROKERS_USERNAME: 'developer',
  TOA_CONVERGENCE_BROKERS_PASSWORD: 'secret'
}

/** the broker of the region this suite plays */
const FAR = 'amqp://developer:secret@localhost:31015'
const FAR_MANAGEMENT = 'http://localhost:31016/api'
const NEAR_MANAGEMENT = 'http://localhost:31014/api'
const AUTHORIZATION = 'Basic ' + Buffer.from('developer:secret').toString('base64')
