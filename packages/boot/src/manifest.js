const query = require('./manifest/query');
const schema = require('./manifest/schema');

const DEFAULT_TEMPLATES_PACKAGE = '@kookaburra/templates';
const DEFAULT_STATE_MAX_LIMIT = 100;
const DEFAULT_STATE_MAX_OMIT = 1000;
const DEFAULT_TRANSPORT = 'amqp';

module.exports = (manifest) => {

    if (!manifest.transport)
        manifest.transport = DEFAULT_TRANSPORT;

    if (manifest.state) {
        if (!manifest.state.name)
            manifest.state.name = manifest.name || manifest.domain;

        if (!manifest.state.max)
            manifest.state.max = {};

        if (!manifest.state.max.limit)
            manifest.state.max.limit = DEFAULT_STATE_MAX_LIMIT;

        if (!manifest.state.max.omit)
            manifest.state.max.omit = DEFAULT_STATE_MAX_OMIT;

        manifest.state.inserted = Boolean(manifest.state.inserted);

        if (manifest.state.schema)
            schema(manifest.state.schema);
    }

    if (typeof manifest.remotes === 'string')
        manifest.remotes = [manifest.remotes];

    if (manifest.operations) {
        for (let [name, om] of Object.entries(manifest.operations)) {
            if (typeof om === 'string')
                om = { template: om };

            if (om === null)
                om = { template: name };

            if (om.template !== undefined) {
                if (typeof om.template === 'string')
                    om.template = { name: om.template };

                if (om.template === null)
                    om.template = { name };

                if (!om.template.package)
                    om.template.package = DEFAULT_TEMPLATES_PACKAGE;

                if (!om.template.name)
                    om.template.name = name;
            }

            if (om.http !== undefined) {
                if (typeof om.http === 'string')
                    om.http = [{ path: om.http }];

                om.http = om.http.map((binding) => {
                    if (typeof binding === 'string')
                        binding = { path: binding };

                    if (om.query || binding.query)
                        binding.query = query(binding.query, query(om.query));

                    if (om.representation)
                        binding.representation = om.representation;

                    return binding;
                });
            }

            if (om.schema)
                schema(om.schema);

            manifest.operations[name] = om;
        }

    }

    return manifest;

};
