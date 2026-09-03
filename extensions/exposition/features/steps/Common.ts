import tsflow from 'cucumber-tsflow'

import { timeout } from '@toa.io/generic'

const { binding, given } = tsflow

@binding()
export class Common {
  @given('after {float} second(s)')
  public async timeout (interval: number): Promise<void> {
    await timeout(interval * 1000)
  }

  @given('the process is running')
  public async noop (): Promise<void> {
  }
}
