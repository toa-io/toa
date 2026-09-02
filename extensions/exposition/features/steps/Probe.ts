import assert from 'node:assert'
import { Agent } from 'undici'
import { after, binding, then, when } from 'cucumber-tsflow'
import { PATH, PROBE } from '../../source/HTTP'

@binding()
export class Probe {
  private readonly agent = new Agent()
  private status: number | null = null
  private headers: Record<string, string> = {}

  @when('the ready probe is requested')
  public async request (): Promise<void> {
    const response = await fetch(`http://127.0.0.1:${PROBE}${PATH}`, { dispatcher: this.agent })

    this.status = response.status
    this.headers = Object.fromEntries(response.headers.entries())

    await response.arrayBuffer()
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
