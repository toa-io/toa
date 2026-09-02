"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providers = void 0;
const FileSystem_js_1 = require("./FileSystem.js");
const S3_js_1 = require("./S3.js");
const Spaces_js_1 = require("./Spaces.js");
const Cloudinary_js_1 = require("./Cloudinary.js");
const Temporary_js_1 = require("./Temporary.js");
const Test_js_1 = require("./Test.js");
exports.providers = {
    s3: S3_js_1.S3,
    spaces: Spaces_js_1.Spaces,
    cloudinary: Cloudinary_js_1.Cloudinary,
    fs: FileSystem_js_1.FileSystem,
    tmp: Temporary_js_1.Temporary,
    test: Test_js_1.Test
};
//# sourceMappingURL=index.js.map