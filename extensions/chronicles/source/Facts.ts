import { Connector, exceptions } from '@toa.io/core'
import type { Row } from './Provider.ts'
import type { Writer } from './Writer.ts'

/** What `chronicles.facts` writes a fact a component sent through. */
export class Facts extends Connector {
  public readonly name = 'chronicles'

  private readonly writer: () => Writer

  public constructor(writer: () => Writer) {
    super()

    this.writer = writer
  }

  public async invoke(method: string, ...args: any[]): Promise<void> {
    if (method !== 'record')
      throw new exceptions.MisuseException(`Chronicles have no '${method}'`)

    await this.writer().write([args[0] as Row])
  }
}
