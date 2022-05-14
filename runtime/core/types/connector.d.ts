declare namespace toa.core {

    interface Connector {
        depends(connector: Connector): Connector

        link(connector: Connector): void

        connect(): Promise<void>

        disconnect(): Promise<void>
    }

}

export type Connector = toa.core.Connector
