const SCHEMA_TYPES = ['number', 'integer', 'string', 'boolean', 'array', 'object', 'null'];

module.exports = (schema) => {
    schema.properties = Object.fromEntries(Object.entries(schema.properties)
        .map(([key, value]) => {
            if (typeof value !== 'object' || value === null) {
                if (SCHEMA_TYPES.includes(value))
                    value = { type: value };
                else {
                    let ref = value;

                    if (value === null)
                        value = '~';

                    if (value[0] === '~') {
                        let name = value.substring(1);

                        if (name.length === 0)
                            name = key;

                        ref = `./#/properties/${name}`;
                    }

                    value = { $ref: ref };
                }
            }

            return [key, value];
        }));
};
