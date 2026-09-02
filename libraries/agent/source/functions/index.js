"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.password = exports.email = exports.functions = void 0;
const id_js_1 = require("./id.js");
const get_js_1 = require("./get.js");
const set_js_1 = require("./set.js");
const basic_js_1 = require("./basic.js");
const email_js_1 = require("./email.js");
Object.defineProperty(exports, "email", { enumerable: true, get: function () { return email_js_1.email; } });
const password_js_1 = require("./password.js");
Object.defineProperty(exports, "password", { enumerable: true, get: function () { return password_js_1.password; } });
const now_js_1 = require("./now.js");
const utc_js_1 = require("./utc.js");
const unix_js_1 = require("./unix.js");
const print_js_1 = require("./print.js");
exports.functions = {
    id: id_js_1.id,
    get: get_js_1.get,
    set: set_js_1.set,
    basic: basic_js_1.basic,
    email: email_js_1.email,
    password: password_js_1.password,
    now: now_js_1.now,
    utc: utc_js_1.utc,
    unix: unix_js_1.unix,
    print: print_js_1.print
};
//# sourceMappingURL=index.js.map