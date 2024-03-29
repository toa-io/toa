export class Connector {
  public id: string
  public connected: boolean

  public connect (): Promise<void>

  public disconnect (interrupt?: boolean): Promise<void>

  public depends (connector: Connector | Connector[]): Connector

  link (connector: Connector): void

  protected open (): Promise<void> | void

  protected close (): Promise<void> | void

  protected dispose (): Promise<void> | void
}
