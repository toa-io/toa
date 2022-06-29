declare namespace toa.core {

    interface Locator {
        name: string
        namespace: string

        id: string
        label: string
        uppercase: string

        hostname(type?: string): string
    }

}

export type Locator = toa.core.Locator
