import { after, binding, given, then } from 'cucumber-tsflow'
import * as boot from '@toa.io/boot'
import { Locator, type Remote } from '@toa.io/core'
import { load as parse } from 'js-yaml'

@binding()
export class Calls {
  private spam!: Remote

  @given('`spam.send` is called:')
  public async call (yaml: string): Promise<void> {
    this.spam ??= await this.connect()

    const input = parse(yaml)

    await this.spam.invoke('send', { input })
  }

  @then('go check the email or logs')
  public sent (): void {
  }

  @after()
  private async disconnect (): Promise<void> {
    await this.spam?.disconnect(true)
  }

  private async connect (): Promise<Remote> {
    const locator = new Locator('spam', 'default')
    const remote = await boot.remote(locator)

    await remote.connect()

    return remote
  }
}
