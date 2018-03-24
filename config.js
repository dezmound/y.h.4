module.exports = {
    name: 'Git Local',
    pwd: process.env.GIT_REPO || 'test-git',
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    dateFormat: 'YYYY-MM-DD HH:mm',
};
