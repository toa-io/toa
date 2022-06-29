declare namespace toa.annotations {

    namespace proxy {
        type Node = {
            [key: string]: string | Node
        }
    }

    type Proxy = {
        default?: string
        [key: string]: proxy.Node | string
    }

}
