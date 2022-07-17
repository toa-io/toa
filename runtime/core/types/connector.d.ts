declare namespace toa.core {

  interface Connector {
    id: string
    connected: boolean

    depends(connector: Connector): Connector

    link(connector: Connector): void

    connect(): Promise<void>

    disconnect(interrupt?: boolean): Promise<void>

    connection(): Promise<void>

    disconnection(): Promise<void>
  }

}

export type Connector = toa.core.Connector
