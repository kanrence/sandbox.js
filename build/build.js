const webpackConfig = require('./webpack.config');

const webpack = require('webpack')

webpack(webpackConfig, (err, stats) => {
    console.log(err)
})