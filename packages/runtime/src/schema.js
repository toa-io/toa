const Ajv = require('ajv');
const freeze = require('deep-freeze');

const OPTIONS = { useDefaults: true };

module.exports = class {

    constructor(schema= {}) {
        this.properties = schema.properties;
        this.projection = undefined;
        this.error = undefined;
        this.errors = undefined;

        schema.additionalProperties = false;
        freeze(schema);

        this._schema = schema;
        this._validate = (new Ajv(OPTIONS)).compile(schema);

        if (schema.unlisted)
            this.projection = schema.unlisted.reduce((c, p) => {
                c[p] = 0;
                return c;
            }, {});
    }

    fit(object = {}) {
        this._clear();

        if (object.constructor !== Object)
            throw new Error('Argument must be an object');

        const valid = this._validate(object || {});

        if (!valid) {
            const first = this._validate.errors[0];

            let error = `${first.dataPath || 'Object'} ${first.message}`;
            let comment;

            switch (first.keyword) {
                case 'enum':
                    comment = first.params.allowedValues.toString();
                    break;
                case 'additionalProperties':
                    comment = first.params.additionalProperty;
            }

            if (comment)
                error = `${error} (${comment})`;

            this.error = error;
            this.errors = this._validate.errors.map((error) => this._format(error));
        }

        return valid;
    }

    _clear() {
        this.error = undefined;
        this.errors = undefined;
    }

    _format(error) {
        const result = {
            keyword: error.keyword,
            message: error.message,
        };

        if (error.dataPath)
            result.property = error.dataPath.replace(/^\./, '');
        else if (error.keyword === 'required')
            result.property = error.params.missingProperty;

        return result;

    }

};
