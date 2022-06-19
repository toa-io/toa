import type { Request, Response } from 'express'

declare namespace toa.extensions.exposition {

    namespace server {
        type Callback = (req: Request, res: Response) => void
    }

    interface Server {
        route(route: string, callback: server.Callback)
    }

}
