declare namespace toa.core {

    interface Locator {
        namespace: string
        name: string
        id: string
        label: string
        uppercase: string

        host(type?: string, level?: number): string
    }

}

export type Locator = toa.core.Locator
