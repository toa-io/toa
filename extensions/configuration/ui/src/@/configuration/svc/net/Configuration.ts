/** A component's configuration for its deployed epoch, with the schema it satisfies. */
export interface Configuration {
  /** The component's name, which is what identifies its configuration. */
  id: string
  component: string
  epoch: string
  configuration: Node
  /** What the value is checked against. An epoch the deployment forgot has none. */
  schema?: object
  /**
   * When the object was created; `0` for the deployed defaults, unless a reset brought
   * them back.
   */
  created: number
  /**
   * Of the deployed defaults when they are what is served; `null` for a created object.
   * A reset is the defaults, so it carries a revision even though `created` is later.
   */
  revision: string | null
}

/** What was created, as the service answers a `POST`. */
export interface Created {
  id: string
  epoch: string
}

export type Node = Record<string, unknown>
