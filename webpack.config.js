
const resolve = require('path').resolve;
const webpack = require('webpack');

module.exports = {
    context : resolve(__dirname, 'src'),
    entry : [
        'babel-polyfill',
        'whatwg-fetch',
        'react',
        'react-dom',
        './index.js'],
    output : {
        path: resolve(__dirname, 'public'),
        filename: 'bundle.js',
        publicPath: '/'
    },

    module: {
        loaders : [
            {
                test: /\.js$/,
                loaders : ['babel-loader?'+JSON.stringify({
                    cacheDirectory : true,
                    presets : ['es2015', 'react']
                })],
                exclude:/node_modules/
            },
            {
                test: /\.svg$/,
                loaders: [
                    {
                        loader: 'babel-loader',
                        query: {
                            presets: ['es2015']
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                loader : 'style-loader!css-loader'
            },
            {
                test: /\.(png|jpg|gif|woff|woff2|eot|ttf|svg)$/,
                loaders: ['url-loader?limit=100000','file-loader']
            }
        ]
    }
};