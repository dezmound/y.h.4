const express = require('express');
const app = express();
const errors = {
    OK: 0x0,
    CONFIG_NOT_FOUND: 0x1,
};
try {
    const config = require('./config.js');
    const router = require('./router')(config);
    app.set('view engine', 'pug');
    app.set('views', './views');
    app.use('/assets', express.static('assets'));
    app.use('/favicon', express.static('favicon'));
    app.use(router);
    app.listen(config.port, config.host);
} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.error(`Не найден файл с конфигурацией.`, err.message);
        process.exit(errors.CONFIG_NOT_FOUND);
    }
    throw err;
}
