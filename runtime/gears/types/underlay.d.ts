declare namespace toa.gears {

    namespace underlay {
        type Callback = (segments: string[], arguments?: string) => any
        type Constructor = (callback: Callback) => Underlay
    }

    interface Underlay {
        (...args: any[]): any

        [key: string]: Underlay
    }

}
