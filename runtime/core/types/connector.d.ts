export class Connector {
  public id: string
  public connected: boolean

  public connect (): Promise<void>

  public disconnect (interrupt?: boolean): Promise<void>

  protected depends (connector: Connector | Connector[]): Connector

  link (connector: Connector): void

  protected open (): Promise<void>

  protected close (): Promise<void>

  protected dispose (): Promise<void>
}
