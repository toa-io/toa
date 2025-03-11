import * as assert from 'node:assert'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import { after, binding, given } from 'cucumber-tsflow'

@binding()
export class Render {
  private server: Server | null = null

  @given('rendering is sending:')
  public async run (html: string): Promise<void> {
    this.server = createServer((req, res) => {
      assert.ok(req.method === 'POST')
      assert.ok(req.headers['content-type'] === 'application/json')

      res.writeHead(200, { 'content-Type': 'text/html' })
      res.end(html)
    })

    await once(this.server.listen(8088), 'listening')
  }

  @after()
  public async stop (): Promise<void> {
    if (this.server === null) return

    await once(this.server.close(), 'close')
  }
}
