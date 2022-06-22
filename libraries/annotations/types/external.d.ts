declare namespace toa.libraries.annotations {

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
