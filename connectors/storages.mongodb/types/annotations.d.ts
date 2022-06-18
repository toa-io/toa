declare namespace toa.storages.mongo {
    namespace annotations {
        type Node = {
            [key: string]: string | Node
        }
    }

    type Annotations = {
        default?: string
        [key: string]: annotations.Node | string
    }
}
