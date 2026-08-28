import assert from 'node:assert'
import * as http from 'node:http'
import { resolve } from 'node:path'
import { after, binding, given, then, when } from 'cucumber-tsflow'
import { UI } from '../../source/UI'
import { UI_PORT } from '../../source/const'

/**
 * The scenarios are about the server, not about the page: it is pointed at a fixture
 * directory, so that running them never needs a UI build.
 */
@binding()
export class Site {
  private server: UI | null = null
  private response: Response | null = null

  @given('the UI is published')
  public async publish (): Promise<void> {
    this.server = new UI(UI_PORT, resolve(__dirname, '..', 'site'))

    await this.server.connect()
  }

  @when('{string} is requested')
  public async request (path: string): Promise<void> {
    this.response = await get(path)
  }

  @then('the status is {int}')
  public statusIs (status: number): void {
    assert.equal(this.response?.status, status)
  }

  @then('the body contains {string}')
  public bodyContains (text: string): void {
    assert.ok(this.response?.body.includes(text),
      `Expected the body to contain '${text}', got '${this.response?.body}'`)
  }

  @then('the body is empty')
  public bodyIsEmpty (): void {
    assert.equal(this.response?.body, '')
  }

  @then('the {string} header is {string}')
  public headerIs (name: string, value: string): void {
    assert.equal(this.response?.headers[name], value)
  }

  @after()
  public async shutdown (): Promise<void> {
    await this.server?.disconnect()

    this.server = null
    this.response = null
  }
}

/**
 * Raw `http`, not `fetch`: the URL parser normalizes `%2e%2e` away, and one of the
 * scenarios is about exactly that segment reaching the server.
 */
async function get (path: string): Promise<Response> {
  return await new Promise((resolve, reject) => {
    // `agent: false` — a keep-alive socket outlives the scenario that opened it
    const request = http.get({ port: UI_PORT, path, agent: false }, (response) => {
      let body = ''

      response.setEncoding('utf8')
      response.on('data', (chunk: string) => (body += chunk))
      response.on('end', () => {
        resolve({
          status: response.statusCode!,
          headers: response.headers as Record<string, string>,
          body
        })
      })
    })

    request.on('error', reject)
  })
}

interface Response {
  status: number
  headers: Record<string, string>
  body: string
}
