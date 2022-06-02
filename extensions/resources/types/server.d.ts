import type { Request, Response } from 'express'

declare namespace toa.extensions.resources {

    namespace server {
        type Callback = (req: Request, res: Response) => void
    }

    interface Server {
        route(route: string, callback: server.Callback)
    }

}
