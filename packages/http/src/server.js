const express = require('express');
const favicon = require('serve-favicon');

const path = require('./path');
const verb = require('./verb');
const bind = require('./bind');

module.exports = class {

    constructor() {
        this._app = this._create();
    }

    bind(operations) {
        operations.forEach((operation) =>
            operation.bindings.forEach((binding) => {
                const { params, route } = path(binding.path);
                bind(this._app, verb(operation, params), route, operation, binding);
            }));
    }

    start() {
        const port = process.env.KOO_HTTP_SERVER_PORT || 8080;

        return new Promise((resolve) => {
            this._server = this._app.listen(port, () => {
                console.log(`HTTP server listening at port ${port}`);
                resolve();
            });
        })
    }

    stop() {
        return new Promise((resolve) => {
            this._server.close(() => {
                console.log('HTTP server stopped');
                resolve();
            });
        });
    }

    _create() {
        const app = express();
        app.disable('x-powered-by');
        app.use(express.json());
        app.use(favicon(`${__dirname}/../assets/favicon.png`));
        app.set('json spaces', 2);

        return app;
    }

};
