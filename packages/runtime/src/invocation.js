const freeze = require('deep-freeze');

module.exports = class {

    constructor(operation, schema) {
        this.endpoint = operation.endpoint;

        this._operation = operation;
        this._schema = schema;
    }

    async invoke(io, ...args) {
        if (io.input !== undefined) {
            const valid = this._schema.fit(io.input);

            if (!valid) {
                io.error.type = 'InputValidationError';
                io.error.message = this._schema.error;
                io.error.fields = this._schema.errors;

                return;
            }

            freeze(io.input);
        }

        await this._operation.invoke(io, ...args);
    }

};
