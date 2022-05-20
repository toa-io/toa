declare namespace toa.core {

    interface Connector {
        id: string
        connected: boolean
        
        depends(connector: Connector): Connector

        link(connector: Connector): void

        connect(): Promise<void>

        disconnect(): Promise<void>
    }

}

export type Connector = toa.core.Connector
