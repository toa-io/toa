/** What a context declares at its root, as the list of regions there are. */
export type Declaration = Region[]

export interface Region {
  /** what this region is deployed as */
  region: string

  /** a rank: zero outranks one, and it is read only where two regions wrote one version */
  priority: number

  binding: {
    /** the binding that carries the channel; `amqp`, which is the only one */
    provider?: string

    /** the brokers of this region, as a URL or a list of them */
    pointer: string | string[]
  }
}
