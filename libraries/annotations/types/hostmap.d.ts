declare namespace toa.annotations {


    namespace hostmap {

        type Node = {
            [key: string]: string | Node
        }

        type Constructor = (declaration: Hostmap | string) => Hostmap

    }

    type Hostmap = {
        default?: string
    } & hostmap.Node
}

export const hostmap: toa.annotations.hostmap.Constructor
