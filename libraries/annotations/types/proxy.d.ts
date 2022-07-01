declare namespace toa.annotations.proxy {

    type Node = {
        [key: string]: string | Node
    }

    type Declaration = {
        default?: string
        [key: string]: Node | string
    }

    type Constructor = (declaration: Declaration | string) => Declaration
}

export const proxy: toa.annotations.proxy.Constructor
