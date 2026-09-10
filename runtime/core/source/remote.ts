import { Component } from './component.js'
import { EndpointException } from './exceptions.js'
import type { Invocable } from './component.js'

/** A call knows what its endpoint declares, which is what an explanation is read from. */
export interface Explicable extends Invocable {
  explain(): any
}

export class Remote extends Component<Explicable> {
  protected override kind = 'client' as const

  public explain(endpoint: string): any {
    if (!(endpoint in this.operations))
      throw new EndpointException(`'${endpoint}' is not provided by '${this.locator.id}'`)

    return this.operations[endpoint].explain()
  }
}
