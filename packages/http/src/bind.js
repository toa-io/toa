const qry = require('./query');
const bdy = require('./body');

module.exports = (app, verb, route, operation, binding) => {

    app[verb](route, async (req, res) => {
        const input = bdy(req, binding);
        const query = qry(operation.state, binding, req);

        let response = undefined, status = 204;

        try {
            const io = await operation.invoke(input, query);

            if (io.error) {
                status = 400 + (io.error.status < 100 ? io.error.status : 0);
                delete io.error.status;

                response = io.error;
            } else if (io.output) {
                status = 200;
                response = io.output;
            }

        } catch (e) {
            status = 500;

            if (process.env.NODE_ENV === 'local')
                response = {
                    message: e.message,
                    stack: e.stack,
                };
        }

        res.status(status)

        if (response) res.json(response);
        else res.end();
    });

};
