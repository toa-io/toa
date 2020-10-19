const express = require('express');
const pth = require('./path');
const vrb = require('./verb');
const qry = require('./query');

module.exports = class {

    constructor() {
        this._app = this._create();
        this._port = process.env.KOO_HTTP_SERVER_PORT || 8080;
    }

    bind(bindings) {
        bindings.forEach((binding) => {
            const verb = vrb(binding).toLowerCase();

            binding.routes.forEach((route) => {
                const { path, expressions } = pth(route.path);

                this._app[verb](path, async (req, res) => {
                    const input = req.body;
                    const query = qry(binding, req, expressions);

                    const result = await binding.invoke(input, query);

                    res.json(result.output);
                });
            });

        });
    }

    start() {
        this._server = this._app.listen(this._port, () => {
            console.log(`HTTP server listening at port ${this._port}`);
        });
    }

    stop() {
        this._server.close(() => {
            console.log('HTTP server stopped');
        });
    }

    _create() {
        const app = express();
        app.use(express.json());
        app.set('json spaces', 2);

        return app;
    }

};
