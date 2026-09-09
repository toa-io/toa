/**
 * What a context declares of the region it is deployed as. The environment names the region,
 * so a context declares one of these per region and shares nothing between them:
 *
 * ```yaml
 * convergence@eu:
 *   priority: 0
 *   binding: { provider: amqp, pointer: amqp://cnv-eu.example.com }
 * ```
 */
export interface Declaration {
  /** a rank: zero outranks one, and it is read only where two regions wrote one version */
  priority: number

  binding: {
    /** the binding that carries the channel; `amqp`, which is the only one */
    provider?: string

    /** the brokers of this region, as a URL or a list of them */
    pointer: string | string[]
  }
}
