export class Connector {
  id: string
  connected: boolean

  depends (connector: Connector): Connector

  link (connector: Connector): void

  connect (): Promise<void>

  disconnect (interrupt?: boolean): Promise<void>

  open (): Promise<void>

  close (): Promise<void>

  dispose (): Promise<void>
}
