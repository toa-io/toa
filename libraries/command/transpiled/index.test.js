"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
jest.mock('node:child_process', () => ({
    exec: (command, callback) => exec(command, callback)
}));
it('should call exec', async () => {
    await (0, index_1.$) `echo ok`;
    expect(exec).toHaveBeenCalled();
    expect(exec.mock.calls[0][0]).toStrictEqual('echo ok');
});
it('should call exec with arguments', async () => {
    const c = 'echo';
    const a = 'ok';
    await (0, index_1.$) `${c} ${a}`;
    expect(exec).toHaveBeenCalled();
    expect(exec.mock.calls[0][0]).toStrictEqual('echo ok');
});
const stdin = {
    write: jest.fn(),
    end: jest.fn()
};
const stdout = {
    pipe: jest.fn()
};
const stderr = {
    pipe: jest.fn()
};
const exec = jest.fn((command, callback) => {
    setImmediate(() => {
        callback(null);
    });
    return {
        stdin,
        stdout,
        stderr
    };
});
//# sourceMappingURL=index.test.js.map