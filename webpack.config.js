const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output:{
        path: path.join(__dirname, 'dist'),
    },
    devtool:'source-map',
    resolve:{
        modules:[path.join(__dirname, 'source'), path.resolve('node_modules')],
    },
    devServer:{
        port: 4324,
        open: true,
        hot: true,
    },
    plugins:[
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'public/index.html'),
        }),
    ]
}