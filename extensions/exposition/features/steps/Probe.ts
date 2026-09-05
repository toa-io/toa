import assert from 'node:assert'
import { Agent, request } from 'undici'
import tsflow from 'cucumber-tsflow'
import { PATH } from '../../source/HTTP/index.js'
import { PROBE } from './Parameters.js'

const { after, binding, then, when } = tsflow

@binding()
export class Probe {
  private readonly agent = new Agent()
  private status: number | null = null
  private headers: Record<string, string> = {}

  @when('the ready probe is requested')
  public async request (): Promise<void> {
    const response = await request(`http://127.0.0.1:${PROBE}${PATH}`, { dispatcher: this.agent })

    this.status = response.statusCode
    this.headers = response.headers as Record<string, string>

    await response.body.dump()
  }

  @then('the ready probe answers {int}')
  public answers (status: number): void {
    assert.equal(this.status, status)

    if (status === 200)
      assert.equal(this.headers['cache-control'], 'no-store')
  }

  @after()
  public async close (): Promise<void> {
    await this.agent.close()
  }
}
