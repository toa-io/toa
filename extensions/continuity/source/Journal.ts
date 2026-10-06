import { Connector, Locator } from '@toa.io/core'
import { COMPONENT, NAMESPACE } from '@toa.io/definitions/extensions.continuity'
import type { Remote } from '@toa.io/core'
import type { extensions, Source } from '@toa.io/core/types'
import type { Kept } from './answers.ts'

/**
 * The component that keeps the runs, as something to call.
 *
 * Resolved on the first call and not before: an extension is built ahead of the components of its
 * composition, so at that point there is nothing to look up yet.
 */
export class Journal extends Connector {
  private readonly host: extensions.Host
  private remote?: Promise<Remote>

  public constructor(host: extensions.Host) {
    super()

    this.host = host
  }

  /** what a run has kept so far, by the key of each step, and when the run is reaped */
  public async recall(run: string): Promise<Recalled> {
    const steps = new Map<string, Kept>()
    let expires: number | undefined

    for (let omit = 0; ; omit += PAGE) {
      const page = (await this.invoke('recall', {
        query: { criteria: `run=="${run}"`, sort: ['id'], limit: PAGE, omit }
      })) as Record[]

      for (const record of page) {
        steps.set(record.id, record.answer)
        expires = record.expires
      }

      if (page.length < PAGE) break
    }

    return { steps, expires }
  }

  /** keeps what a step answered, unless another attempt kept it first, and answers what is kept */
  // eslint-disable-next-line max-params
  public async record(
    run: string,
    key: string,
    answer: Kept,
    expires: number
  ): Promise<Kept> {
    return (await this.invoke('record', {
      query: { id: key },
      input: { run, answer, expires }
    })) as Kept
  }

  private async invoke(endpoint: string, request: object): Promise<unknown> {
    this.remote ??= this.locate()

    // what the journal refuses or fails with is thrown, as for any call
    return await (await this.remote).invoke(endpoint, request)
  }

  private async locate(): Promise<Remote> {
    const remote = await this.host.remote(new Locator(COMPONENT, NAMESPACE), SOURCE)

    this.depends(remote)

    await remote.connect()

    return remote
  }
}

export interface Recalled {
  steps: Map<string, Kept>
  expires: number | undefined
}

interface Record {
  id: string
  answer: Kept
  expires: number
}

/** records one read brings back */
const PAGE = 1000

// what the journal is called by; without it the calls arrive unattributed
const SOURCE: Source = { service: 'continuity' }
