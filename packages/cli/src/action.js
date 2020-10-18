const RED = '\x1b[31m%s\x1b[0m';

module.exports = (command) => {

    return async (...args) => {
        let io;

        try {
            io = await command(...args);
        } catch (e) {
            console.error(RED, e);
            return;
        }

        if (io.error) {
            const type = io.error.type;
            const message = `${type ? `${type}: ` : ''}${io.error.message || 'An error occurred'}`;

            console.error(RED, message);

            return;
        }

        io.output && console.log(io.output);
    }

};

