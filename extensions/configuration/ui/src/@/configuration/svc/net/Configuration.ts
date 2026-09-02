/** A component's configuration for its deployed epoch, with the schema it satisfies. */
export interface Configuration {
  /** The component's name, which is what identifies its configuration. */
  id: string
  component: string
  epoch: string
  configuration: Node
  /** What the value is checked against. An epoch the deployment forgot has none. */
  schema?: object
}

/** What was created, as the service answers a `POST`. */
export interface Created {
  id: string
  epoch: string
}

export type Node = Record<string, unknown>
