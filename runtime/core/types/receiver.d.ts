declare namespace toa.core {

    interface Receiver {
        receive(payload: Object): Promise<void>
    }

}

export type Receiver = toa.core.Receiver
