import assert from 'node:assert'
import { after, binding, given, then, when } from 'cucumber-tsflow'
import { UI } from '../../source/UI'
import { UI_PATH, UI_PORT } from '../../source/const'

@binding()
export class Site {
  private server: UI | null = null
  private status = 0
  private body = ''

  @given('the UI is published')
  public async publish (): Promise<void> {
    await this.start(UI_PATH)
  }

  @given('the UI is published at the root')
  public async publishAtRoot (): Promise<void> {
    await this.start('')
  }

  @when('{string} is requested')
  public async request (path: string): Promise<void> {
    const response = await fetch(`http://localhost:${UI_PORT}${path}`)

    this.status = response.status
    this.body = await response.text()
  }

  @then('the status is {int}')
  public statusIs (status: number): void {
    assert.equal(this.status, status)
  }

  @then('the body is {string}')
  public bodyIs (body: string): void {
    assert.equal(this.body, body)
  }

  @after()
  public async shutdown (): Promise<void> {
    await this.server?.disconnect()

    this.server = null
  }

  private async start (base: string): Promise<void> {
    this.server = new UI(UI_PORT, base)

    await this.server.connect()
  }
}
