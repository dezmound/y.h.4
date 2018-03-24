const env = process.env.MODE;
const path = require('path');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/js/entry.js',
    output: {
        path: path.resolve(__dirname, 'assets'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: env === 'prod'
                    ? ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: [{
                            loader: 'css-loader',
                            options: {
                                minimize: true,
                            },
                        }],
                    })
                    : ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: env === 'prod'
        ? [
            new ExtractTextPlugin({
                filename: 'bundle.css',
            }),
        ]
        : [],
};
