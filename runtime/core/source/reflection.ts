import { Connector } from './connector.js'

/** What a reflection reads, once, as it connects. */
export type Source<T = any> = () => Promise<T>

export class Reflection<T = any> extends Connector {
  public value: T | undefined

  readonly #source: Source<T>

  public constructor (source: Source<T>) {
    super()

    this.#source = source
  }

  protected override async open (): Promise<void> {
    this.value = await this.#source()
  }
}
