declare namespace toa.gears {

    interface Underlay {
        (...args: any[]): any

        [key: string]: Underlay
    }

}
