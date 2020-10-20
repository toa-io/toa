const qry = require('./query');

module.exports = (app, verb, route, operation, binding) => {

    app[verb](route, async (req, res) => {
        const input = req.body;
        const query = qry(operation, binding, req);

        let response = undefined, status = 200;

        try {
            const io = await operation.invoke(input, query);

            if (io.error) {
                status = 400 + (io.error.status < 100 ? io.error.status : 0);
                delete io.error.status;

                response = io.error;
            } else {
                response = io.output;
            }

        } catch (e) {
            status = 500 + (e.status < 100 ? e.status : 0);

            if (process.env.NODE_ENV === 'local')
                response = {
                    message: e.message,
                    stack: e.stack,
                };
        }

        res.status(status)

        if (response)
            res.json(response);
        else res.end();
    });

};
