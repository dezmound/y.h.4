module.exports = {
    baseUrl: 'https://shri-h-4-dev.herokuapp.com/',
    gridUrl: 'http://0.0.0.0:4444/wd/hub',

    browsers: {
        chrome: {
            desiredCapabilities: {
                browserName: 'chrome'
            },
        },
        firefox: {
            desiredCapabilities: {
                browserName: 'firefox'
            },
        }
    },
};