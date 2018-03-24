module.exports = (config) => {
    const express = require('express');
    const router = new express.Router();
    const mainController = require('../controllers/mainController')(config);
    router.get('/', (req, res) => {
        res.redirect('/HEAD');
    });
    router.get(/\/([^:]+)(\:(.*))?/, mainController);
    router.use((req, res) => {
        res.status(404).render('not_found');
    });
    return router;
};
