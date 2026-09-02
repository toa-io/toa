"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
const generic_1 = require("@toa.io/generic");
const index_js_1 = require("./RTD/index.js");
function resolve() {
    const value = process.env.TOA_EXPOSITION;
    const root = value !== undefined ? JSON.parse(value) : index_js_1.syntax.createNode();
    (0, generic_1.merge)(root, PREDEFINED);
    return root;
}
const PREDEFINED = {
    routes: [
        {
            path: '/identity',
            node: {
                isolated: true,
                routes: [],
                methods: [
                    {
                        verb: 'GET',
                        directives: [
                            {
                                family: 'io',
                                name: 'output',
                                value: ['id', 'roles']
                            },
                            {
                                family: 'auth',
                                name: 'echo',
                                value: null
                            }
                        ]
                    },
                    {
                        verb: 'POST',
                        directives: [
                            {
                                family: 'io',
                                name: 'output',
                                value: ['id', 'roles']
                            },
                            {
                                family: 'auth',
                                name: 'incept',
                                value: null
                            }
                        ]
                    }
                ],
                directives: []
            }
        }
    ],
    methods: [],
    directives: []
};
//# sourceMappingURL=root.js.map